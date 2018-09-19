import { RPSOutput, RPSCountdownState, RPSAction, RPSController } from 'rps-stuff';
import { post } from 'request-promise-native';

export interface ShootHTTPOutputURLs {
  init: string;
  start: string;
  shoot: string;
  stop: string;
}

export class ShootHTTPOutput implements RPSOutput {
  initURL: URL;
  startURL: URL;
  shootURL: URL;
  stopURL: URL;

  constructor({init, start, shoot, stop}: ShootHTTPOutputURLs) {
    this.initURL  = new URL(init);
    this.startURL = new URL(start);
    this.shootURL = new URL(shoot);
    this.stopURL  = new URL(stop);
  }

  private rps: RPSController;

  init(rps: RPSController) {
    this.rps = rps;
    this.send(this.initURL);
  };

  private async send(url: URL) {
    console.log(url.toString());
    try {
      return await post(url.toString());
    } catch (e) {
      console.log(e.stack);
    }
  }

  countdown(state: RPSCountdownState) {
    if (state === 0) {
      this.send(this.startURL);
    }
  }

  shootStart() {
    this.send(this.shootURL);
  }

  shootEnd() {
    this.stopURL.searchParams.set("action", this.rps.humanAction.toString());
    this.send(this.stopURL);
  }

  cleanup() {};
  idle() {};
  gameStart() {};
  gameStop() {};
  shoot(_: RPSAction) {}
  robotWin(_r: RPSAction, _h: RPSAction) {}
  humanWin(_r: RPSAction, _h: RPSAction) {}
  tie(_: RPSAction) {}
  score(_r: number, _h: number) {}
  tryAgain() {}
}
