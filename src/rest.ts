import { RPSInput, RPSState, RPSAction } from 'rps-stuff';
import { Express } from 'express';

export class RESTInput extends RPSInput {
  isTakingInput = false;
  private rock: number[] = [];
  private paper: number[] = [];
  private scissors: number[] = [];
  private numInputs = 0;
  // private invalidCount = 0;
  threshold = 0.95;
  roll = 10;
  maxTime = 500;
  maxTimeout: NodeJS.Timer = null;
  log = false;

  constructor(public app: Express) {
    super();
  }

  init() {
    this.app.get("/ready", (_req, res) => {
      return res.status(200).json({ok: true, ready: this.isTakingInput});
    });
    this.app.post("/action", (req, res) => {
      if (this.isTakingInput) {
        if (this.log) {
          console.log([req.body.paper, req.body.rock, req.body.scissors]);
        }
        this.rock.push(req.body.rock);
        this.paper.push(req.body.paper);
        this.scissors.push(req.body.scissors);
        if (this.numInputs > this.roll) {
          [this.rock, this.paper, this.scissors].forEach(array => array.shift());
          if (this.getAverage(this.rock) >= this.threshold) {
            this.isTakingInput = false;
            this.emit("move", RPSAction.Rock);
          } else if (this.getAverage(this.paper) >= this.threshold) {
            this.isTakingInput = false;
            this.emit("move", RPSAction.Paper);
          } else if (this.getAverage(this.scissors) >= this.threshold) {
            this.isTakingInput = false;
            this.emit("move", RPSAction.Scissors);
          }
        }
        this.numInputs++;
        return res.status(200).json({ok: true});
      } else {
        return res.status(400).json({ok: false, error: "not_ready"});
      }
    });
  }

  getAverage(array: number[]) {
    return array.length > 0 ? array.reduce((acc, cur, idx) => acc * (idx / (idx + 1)) + (cur / (idx + 1))) : 0;
  }

  onChangeState(state: RPSState) {
    if (state !== RPSState.Shoot && this.maxTimeout) {
      this.isTakingInput = false;
      clearTimeout(this.maxTimeout);
      this.maxTimeout = null;
    }
  }

  getBestGuess() {
    let max: RPSAction = RPSAction.Rock;
    let maxNum: number = this.getAverage(this.rock);
    let paperAvg = this.getAverage(this.paper);
    if (paperAvg > maxNum) {
      max = RPSAction.Paper;
      maxNum = paperAvg;
    }
    let scissorsAvg = this.getAverage(this.scissors);
    if (scissorsAvg > maxNum) {
      max = RPSAction.Scissors;
      maxNum = scissorsAvg;
    }
    return maxNum <= 0 ? RPSAction.Invalid : max;
  }

  getAction() {
    this.rock = [];
    this.paper = [];
    this.scissors = [];
    this.numInputs = 0;
    this.isTakingInput = true;
    return Promise.race([
      new Promise((res) => {
        this.maxTimeout = setTimeout(() => {
          this.isTakingInput = false;
          res(this.getBestGuess());
        }, this.maxTime);
      }),
      this.promise("move")
    ]);
  }


}
