import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: Promise<WebContainer> | null = null;

export async function getWebContainerInstance() {
  if (!webcontainerInstance) {
    webcontainerInstance = WebContainer.boot();
  }
  return webcontainerInstance;
}
