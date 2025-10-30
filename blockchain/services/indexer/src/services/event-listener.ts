import { Connection, PublicKey, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { config, connectionPool } from '../config';
import { logger } from '../utils/logger';
import {
  ProgramEvent,
  EventType,
  MemoryMintedEvent,
  MemoryTransferredEvent,
  AccessPolicyUpdatedEvent,
  VersionCreatedEvent,
  BatchCreatedEvent,
} from '../types';

export class EventListener {
  private connection: Connection;
  private programId: PublicKey;
  private isRunning: boolean = false;
  private currentSlot: number = 0;
  private eventHandlers: Map<EventType, ((event: ProgramEvent) => Promise<void>)[]> = new Map();

  constructor() {
    this.connection = connectionPool.getConnection();
    this.programId = new PublicKey(config.solana.programId);
    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    // Initialize empty handler arrays for each event type
    Object.values(EventType).forEach((eventType) => {
      this.eventHandlers.set(eventType, []);
    });
  }

  /**
   * Register an event handler for a specific event type
   */
  on(eventType: EventType, handler: (event: ProgramEvent) => Promise<void>): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
    logger.info(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Start listening for events from a specific slot
   */
  async start(fromSlot?: number): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event listener is already running');
      return;
    }

    this.isRunning = true;
    this.currentSlot = fromSlot || (await this.connection.getSlot());
    
    logger.info(`Starting event listener from slot ${this.currentSlot}`);

    // Start polling loop
    this.pollEvents();
  }

  /**
   * Stop listening for events
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info('Event listener stopped');
  }

  /**
   * Poll for new events
   */
  private async pollEvents(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processSlotRange(this.currentSlot, this.currentSlot + config.indexer.batchSize);
        this.currentSlot += config.indexer.batchSize;
        
        // Wait before next poll
        await this.sleep(config.indexer.pollInterval);
      } catch (error) {
        logger.error('Error polling events:', error);
        await this.sleep(config.indexer.pollInterval * 2);
      }
    }
  }

  /**
   * Process a range of slots
   */
  private async processSlotRange(startSlot: number, endSlot: number): Promise<void> {
    try {
      const latestSlot = await this.connection.getSlot();
      
      // Don't process future slots
      if (startSlot > latestSlot) {
        await this.sleep(config.indexer.pollInterval);
        return;
      }

      const actualEndSlot = Math.min(endSlot, latestSlot);
      
      logger.debug(`Processing slots ${startSlot} to ${actualEndSlot}`);

      // Get signatures for program
      const signatures = await this.connection.getSignaturesForAddress(
        this.programId,
        {
          limit: config.indexer.batchSize,
        }
      );

      // Process each transaction
      for (const sigInfo of signatures) {
        if (sigInfo.slot >= startSlot && sigInfo.slot <= actualEndSlot) {
          await this.processTransaction(sigInfo.signature, sigInfo.slot);
        }
      }
    } catch (error) {
      logger.error(`Error processing slot range ${startSlot}-${endSlot}:`, error);
      throw error;
    }
  }

  /**
   * Process a single transaction
   */
  private async processTransaction(signature: string, slot: number): Promise<void> {
    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta) {
        return;
      }

      // Parse events from transaction logs
      const events = this.parseEventsFromTransaction(tx, slot, signature);

      // Emit events to handlers
      for (const event of events) {
        await this.emitEvent(event);
      }
    } catch (error) {
      logger.error(`Error processing transaction ${signature}:`, error);
    }
  }

  /**
   * Parse events from transaction logs
   */
  private parseEventsFromTransaction(
    tx: ParsedTransactionWithMeta,
    slot: number,
    signature: string
  ): ProgramEvent[] {
    const events: ProgramEvent[] = [];

    if (!tx.meta?.logMessages) {
      return events;
    }

    // Parse program logs for events
    for (const log of tx.meta.logMessages) {
      const event = this.parseLogMessage(log, slot, signature, tx.blockTime || Date.now() / 1000);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Parse a single log message
   */
  private parseLogMessage(
    log: string,
    slot: number,
    signature: string,
    timestamp: number
  ): ProgramEvent | null {
    try {
      // Anchor events are logged as: "Program log: EVENT_NAME: {data}"
      if (!log.startsWith('Program log:')) {
        return null;
      }

      const logContent = log.substring('Program log:'.length).trim();

      // Parse MemoryMinted event
      if (logContent.startsWith('MemoryMinted:')) {
        const data = this.parseEventData<MemoryMintedEvent>(logContent);
        return {
          type: EventType.MEMORY_MINTED,
          data,
          slot,
          signature,
          timestamp: new Date(timestamp * 1000),
        };
      }

      // Parse MemoryTransferred event
      if (logContent.startsWith('MemoryTransferred:')) {
        const data = this.parseEventData<MemoryTransferredEvent>(logContent);
        return {
          type: EventType.MEMORY_TRANSFERRED,
          data,
          slot,
          signature,
          timestamp: new Date(timestamp * 1000),
        };
      }

      // Parse AccessPolicyUpdated event
      if (logContent.startsWith('AccessPolicyUpdated:')) {
        const data = this.parseEventData<AccessPolicyUpdatedEvent>(logContent);
        return {
          type: EventType.ACCESS_POLICY_UPDATED,
          data,
          slot,
          signature,
          timestamp: new Date(timestamp * 1000),
        };
      }

      // Parse VersionCreated event
      if (logContent.startsWith('VersionCreated:')) {
        const data = this.parseEventData<VersionCreatedEvent>(logContent);
        return {
          type: EventType.VERSION_CREATED,
          data,
          slot,
          signature,
          timestamp: new Date(timestamp * 1000),
        };
      }

      // Parse BatchCreated event
      if (logContent.startsWith('BatchCreated:')) {
        const data = this.parseEventData<BatchCreatedEvent>(logContent);
        return {
          type: EventType.BATCH_CREATED,
          data,
          slot,
          signature,
          timestamp: new Date(timestamp * 1000),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error parsing log message:', error);
      return null;
    }
  }

  /**
   * Parse event data from log content
   */
  private parseEventData<T>(logContent: string): T {
    const jsonStart = logContent.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('Invalid event format: no JSON data found');
    }

    const jsonStr = logContent.substring(jsonStart);
    return JSON.parse(jsonStr) as T;
  }

  /**
   * Emit event to registered handlers
   */
  private async emitEvent(event: ProgramEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    
    logger.debug(`Emitting event ${event.type} from slot ${event.slot}`);

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  /**
   * Get current slot
   */
  getCurrentSlot(): number {
    return this.currentSlot;
  }

  /**
   * Check if listener is running
   */
  isListening(): boolean {
    return this.isRunning;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default EventListener;
