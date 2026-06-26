export class Strategy {
  async onStart(i, ch, options) { throw new Error('not implemented'); }
  async onSubmit(i, ch, fileMeta) { throw new Error('not implemented'); }
  async onView(i, ch, opts) { throw new Error('not implemented'); }
}
