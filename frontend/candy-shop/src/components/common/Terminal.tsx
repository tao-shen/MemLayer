import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { WebContainer } from '@webcontainer/api';

interface TerminalProps {
  webContainer: WebContainer | null;
}

export const Terminal = ({ webContainer }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      convertEol: true,
      cursorBlink: true,
      theme: {
        background: '#0f0f10',
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!webContainer || !xtermRef.current) return;

    let shellProcess: any = null;

    const startShell = async () => {
        shellProcess = await webContainer.spawn('jsh', {
            terminal: {
                cols: xtermRef.current!.cols,
                rows: xtermRef.current!.rows,
            }
        });
        
        shellProcess.output.pipeTo(new WritableStream({
          write(data: string) {
                xtermRef.current!.write(data);
            }
        }));

        const input = shellProcess.input.getWriter();
      xtermRef.current!.onData((data: string) => {
            input.write(data);
        });
    };

    startShell();

    return () => {
      if (shellProcess) {
        shellProcess.kill();
      }
    };

  }, [webContainer]);

  return <div ref={terminalRef} className="h-full w-full min-h-[400px]" />;
};
