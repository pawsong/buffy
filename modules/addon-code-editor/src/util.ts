export function once(target: EventTarget, type: string, fn: (data: any) => any) {
  const _handler = (msg: MessageEvent) => {
    if (msg.data.type !== type) { return; }
    fn(msg.data);
    target.removeEventListener('message', _handler);
  };
  target.addEventListener('message', _handler);
}
