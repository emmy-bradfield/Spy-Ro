import React, { useState, useEffect } from 'react';
import styles from './engine.module.scss';
import { useEvent } from '../../hooks';
import Toxins from '../../assets/toxins.mp3';

const BLOCKS = [
  140,
  250,
  390,
];

const charWidth = 100;
const charHeight = 200;

const blockWidth = 110;
const blockHeight = 110;

const JUMP_VELOCITY = 1.4;

function CreateEngine(setState) {
  this.settings = {
    tile: 10,
  };

  this.game = 'start';
  this.stage = 0;
  this.jump = false;
  this.direction = 'up';
  this.position = 0;
  this.max = this.settings.tile * 30;
  this.blocks = BLOCKS.map((b) => (b * this.settings.tile));

  const checkBlocks = () => {
    const charXPos = this.stage + 200;
    const charYPos = this.position;

    // if the char has past all blocks
    if (charXPos > this.blocks[this.blocks.length - 1] + 200 && this.position <= 0) {
      this.game = 'win';
    }

    this.blocks.forEach((block) => {
      // if char hits a block
      if (
        charXPos + charWidth >= block
        && charYPos <= blockHeight
        && charYPos + charHeight >= 0
        && charXPos <= block + blockWidth
      ) {
        this.game = 'fail';
      }
    });
  };

  const doJump = () => {
    // if not jumping, reset and return
    if (!this.jump) {
      this.position = 0;
      this.direction = 'up';
      return;
    }

    // if finished jumping, reset and return
    if (this.direction === 'down' && this.position <= 0) {
      this.jump = false;
      this.position = 0;
      this.direction = 'up';
      return;
    }

    // if the jump is at its max, start falling
    if (this.position >= this.max) this.direction = 'down';

    // depending on the direction increment the jump.
    if (this.direction === 'up') {
      this.position += (this.settings.tile * JUMP_VELOCITY);
    } else {
      this.position -= (this.settings.tile * JUMP_VELOCITY);
    }
  };

  // function that will be continuously ran
  this.repaint = () => {
    // move the stage by one tile
    this.stage += this.settings.tile;

    // check if char has hit a block
    checkBlocks();

    // check and perform jump
    doJump();

    // set state for use in the component
    setState({
      stage: this.stage,
      jump: this.position,
      blocks: this.blocks,
      status: this.game,
    });

    // stop the game if the game var has been set to false
    if (this.game !== 'start') {
      // reset and stop
      this.game = 'start';
      this.stage = 0;
      this.jump = false;
      this.direction = 'up';
      this.position = 0;
      return null;
    }

    // start repaint on next frame
    return requestAnimationFrame(this.repaint);
  };

  // trigger initial paint
  this.repaint();
  return () => ({
    jump: () => {
      // if jump is not active, trigger jump
      if (!this.jump) {
        this.jump = true;
      }
    },
  });
}

const initialState = {
  stage: 0,
  jump: 0,
  blocks: [],
  status: 'start',
};

export default function Engine() {
  // game state
  const [gameState, setGameState] = useState(initialState);

  // trigger game to start
  const [start, setStart] = useState(false);

  // if game is running
  const [started, setStarted] = useState(false);

  // instance of game engine
  const [engine, setEngine] = useState(null);

  const [score, setScore] = useState(0);

  const [toxins, setAudio] = useState(new Audio(Toxins));

  const handleStart = (e) => {
    if (e.key === 's') {
      if (!started && !start) {
        setStart(true);
      }
    }
  };

  const handleKeyPress = (e) => {
    // the ' ' char actually represents the space bar key.
    if (e.key === ' ') {
      if (engine === null) return;
        engine.jump();
      }
    }

  useEvent('keyup', handleKeyPress);
  useEvent('keyup', handleStart);

  useEffect(() => {
    if (start) {
      setStarted(true);
      setStart(false);
      toxins.currentTime = 0;
      toxins.play();
      // create a new engine and save it to the state to use
      setEngine(
        new CreateEngine(
          // set state
          (state) => setGameState(state),
        ),
      );
    }

    if (gameState.status === 'fail' && started) {
      setStarted(false);
      setStart(false);
      toxins.pause();
      setGameState(initialState);
      window.alert("You died :( Press 'OK' to restart")
    }

    if (gameState.status === 'win' && started) {
      setStarted(false);
      toxins.pause();
      setGameState(initialState);
      window.alert("Yay! You won! Press OK to play again")
    }
  });

  return (
    <div
      className={styles.container}
    >
      <div
        className={styles.stage}
        style={{
          transform: `translate(-${gameState.stage}px, 0px)`, // move stage
        }}
      >
        <br />
        <h5
          className={styles.text}
          style={{
            transform: `translate(${gameState.stage + 200}px, -${gameState.jump}px)`,
          }}
        >
          SCORE: &nbsp;
          {score}
        </h5>
        <span
          className={styles.character}
          style={{
            transform: `translate(${gameState.stage + 200}px, -${gameState.jump}px)`, // move char in opposite direction
            height: charHeight,
            width: charWidth,
          }}
        />
        {
          gameState.blocks.map(
            (block) => (
              <span
                className={styles.block}
                key={block}
                style={{
                  transform: `translate(${block}px, 0px)`, // move stage
                  height: blockHeight,
                  width: blockWidth,
                }}
              />
            ),
          )
        }
      </div>
    </div>
  );
}
