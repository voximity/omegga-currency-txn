import OmeggaPlugin, { OL, PS, PC } from 'omegga';

type Config = {};
type Storage = {};

export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  async init() {
    const currency = await this.omegga.getPlugin('currency');
    if (!currency) {
      console.error(
        'The currency plugin is not installed, so this plugin will not work!'
      );
      return;
    }

    this.omegga.on('cmd:pay', async (speaker, target, amount) => {
      const from = this.omegga.getPlayer(speaker);
      const to = this.omegga.getPlayer(target);
      if (to == null) {
        this.omegga.whisper(speaker, `<color="f00">Invalid player!</>`);
        return;
      }

      if (from.id === to.id) {
        this.omegga.whisper(
          speaker,
          `<color="f00">You cannot pay yourself!</>`
        );
        return;
      }

      const value = Number(amount);
      if (value == null || isNaN(value) || value <= 0) {
        this.omegga.whisper(speaker, `<color="f00">Invalid amount!</>`);
        return;
      }

      const cur = await currency.emitPlugin('get.currency', [from.id]);

      if (cur < value) {
        this.omegga.whisper(
          speaker,
          `<color="f00">Your balance of ${await currency.emitPlugin(
            'currency',
            [from.id]
          )} is not enough to pay that amount!`
        );
        return;
      }

      await currency.emitPlugin('add.currency', [from.id, -value]);
      await currency.emitPlugin('add.currency', [to.id, value]);

      const formatted = await currency.emitPlugin('format', [value]);
      this.omegga.whisper(
        from,
        `You have paid <color="0ff">${to.name}</> <color="ff0">${formatted}</>.`
      );
      this.omegga.whisper(
        to,
        `<color="0ff">${from.name}</> has paid you <color="ff0">${formatted}</>.`
      );
    });

    return { registeredCommands: ['pay'] };
  }

  async stop() {
    // Anything that needs to be cleaned up...
  }
}
