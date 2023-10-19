import type { LinksFunction } from "@remix-run/node";
import React, { useContext, useReducer } from "react";

import resetUrl from "~/styles/reset.css";
import stylesUrl from "~/styles/index.css";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: stylesUrl },
    { rel: "stylesheet", href: resetUrl }
  ];
};

const BANNERSPEAR_BACK = '/assets/character/bannerspear/back.jpeg';
const BANNERSPEAR_MAT = '/assets/character/bannerspear/mat.jpeg';

const BANNERSPEAR_CARDS: Card[] = [
  { characterClass: 'bannerspear', name: 'At All Costs', level: 1, imgUrl: '/assets/character/bannerspear/at-all-costs.jpeg' },
  { characterClass: 'bannerspear', name: 'Combined Effort', level: 1, imgUrl: '/assets/character/bannerspear/combined-effort.jpeg' },
  { characterClass: 'bannerspear', name: 'Deflecting Maneuver', level: 1, imgUrl: '/assets/character/bannerspear/deflecting-maneuver.jpeg' },
  { characterClass: 'bannerspear', name: 'Driving Inspiration', level: 'x', imgUrl: '/assets/character/bannerspear/driving-inspiration.jpeg' },
  { characterClass: 'bannerspear', name: 'Incindiary Throw', level: 'x', imgUrl: '/assets/character/bannerspear/incendiary-throw.jpeg' },
  { characterClass: 'bannerspear', name: 'Javelin', level: 1, imgUrl: '/assets/character/bannerspear/javelin.jpeg' },
  { characterClass: 'bannerspear', name: 'Pincer Movement', level: 1, imgUrl: '/assets/character/bannerspear/pincer-movement.jpeg' },
  { characterClass: 'bannerspear', name: 'Rallying Cry', level: 1, imgUrl: '/assets/character/bannerspear/rallying-cry.jpeg' },
  { characterClass: 'bannerspear', name: 'Regroup', level: 1, imgUrl: '/assets/character/bannerspear/regroup.jpeg' },
  { characterClass: 'bannerspear', name: 'Resolved Courage', level: 'x', imgUrl: '/assets/character/bannerspear/resolved-courage.jpeg' },
  { characterClass: 'bannerspear', name: 'Set for the Charge', level: 1, imgUrl: '/assets/character/bannerspear/set-for-the-charge.jpeg' },
  { characterClass: 'bannerspear', name: 'Tip of the Spear', level: 1, imgUrl: '/assets/character/bannerspear/tip-of-the-spear.jpeg' },
  { characterClass: 'bannerspear', name: 'Unbreakable Wall', level: 1, imgUrl: '/assets/character/bannerspear/unbreakable-wall.jpeg' },
  { characterClass: 'bannerspear', name: 'Meat Grinder', level: 2, imgUrl: '/assets/character/bannerspear/meat-grinder.jpeg' },
  { characterClass: 'bannerspear', name: 'Pinning Charge', level: 2, imgUrl: '/assets/character/bannerspear/pinning-charge.jpeg' },
  { characterClass: 'bannerspear', name: 'Head of the Hammer', level: 3, imgUrl: '/assets/character/bannerspear/head-of-the-hammer.jpeg' },
  { characterClass: 'bannerspear', name: 'Let Them Come', level: 3, imgUrl: '/assets/character/bannerspear/let-them-come.jpeg' },
];

const BANNERSPEAR_DECK_CARDS: Card[] = BANNERSPEAR_CARDS.filter((c) => {
  return (c.level === 1 && c.name !== "Pincer Movement" && c.name !== "Deflecting Maneuver") ||
    (c.name === "Meat Grinder") ||
    (c.name === "Let Them Come")
});

type GameState = {
  library: Card[];
  deck: CardInPlay[];
  shortRestCandidateBurn: CardInPlay | undefined;
}

type CardAction = {
  kind: "update",
  card: CardInPlay;
  status: CardStatus;
} | {
  kind: "short_rest_prepare",
} | {
  kind: "short_rest_redraw",
} | {
  kind: "short_rest_confirm",
};

function updateGameState(state: GameState, action: CardAction): GameState {
  switch (action.kind) {
    case "update":
      return {
        ...state,
        deck: state.deck.map((c) => {
          return c === action.card
            ? { ...c, status: action.status }
            : c;
        })
      }
    case "short_rest_prepare":
      const discarded = discardedCards(state);
      const candidateBurnIdx = Math.floor(Math.random() * discarded.length);
      const candidateBurn = discarded[candidateBurnIdx]
      return {
        ...state,
        shortRestCandidateBurn: candidateBurn
      };
    case "short_rest_confirm":
      const burn = state.shortRestCandidateBurn;
      return {
        ...state,
        shortRestCandidateBurn: undefined,
        deck: state.deck.map((c) => {
          return { ...c, status: c === burn ? "burned" : c.status === "discarded" ? "in hand" : c.status }
        })
      }
    case "short_rest_redraw":
      const discardedWithoutPrevCandidate = discardedCards(state).filter((c) => c !== state.shortRestCandidateBurn);
      const newBurnIdx = Math.floor(Math.random() * discardedWithoutPrevCandidate.length);
      const newBurn = discardedWithoutPrevCandidate[newBurnIdx];
      return {
        ...state,
        shortRestCandidateBurn: undefined,
        deck: state.deck.map((c) => {
          return { ...c, status: c === newBurn ? "burned" : c.status === "discarded" ? "in hand" : c.status }
        })
      }
  }  
}

const GameStateContext = React.createContext<GameState>({
  library: [],
  deck: [],
  shortRestCandidateBurn: undefined,
});

const GameDispatchContext = React.createContext<React.Dispatch<CardAction>>(() => {
  /* do nothing */
});

function WithGameState({children}: { children: React.ReactNode }) {
  const [ gameState, dispatch ] = useReducer(updateGameState, {
    library: BANNERSPEAR_CARDS,
    deck: BANNERSPEAR_DECK_CARDS.map((c) => {
      return {
        card: c,
        status: 'in hand' as const,
      }
    }),
    shortRestCandidateBurn: undefined,
  });
  return (
    <GameDispatchContext.Provider value={dispatch}>
      <GameStateContext.Provider value={gameState}>
        {children}
      </GameStateContext.Provider>
    </GameDispatchContext.Provider>
  )
}

function useGameState() {
  return useContext(GameStateContext);
}

function useGameDispatch() {
  return useContext(GameDispatchContext);
}

export default function Index() {
  return (
    <div className="wrapper">
      <h1 className="title">Frosthaven Hand Holder</h1>
      <WithGameState>
        <CardLayout />
      </WithGameState>
      <CharacterMat />
    </div>
  );
}

function selectedCards(state: GameState) {
  return state.deck.filter((c) => c.status === 'selected');
}
function inHandCards(state: GameState) {
  return state.deck.filter((c) => c.status === 'in hand');
}
function activeCards(state: GameState) {
  return state.deck.filter((c) => c.status === 'active');
}
function discardedCards(state: GameState) {
  return state.deck.filter((c) => c.status === 'discarded');
}
function burnedCards(state: GameState) {
  return state.deck.filter((c) => c.status === 'burned');
}

function CardLayout() {
  return (
    <div className="card-columns-wrapper">
      <div>
        <div className="in-play-section">
          <SelectedCards />
          <ActiveCards />
        </div>
        <DiscardedCards />
        <BurnedCards />
      </div>
      <div className="hand-column">
        <HandCards />
      </div>
    </div>
  )
}

function HandCards() {
  const gameState = useGameState();
  const cards = inHandCards(gameState);
  return (
    <div>
      <h2>in hand</h2>
      <div className="hand-cards">
        {cards.map((c, i) => {
          return <Card key={i} card={c} />;
        })}
      </div>
    </div>
  )
}

function SelectedCards() {
  const gameState = useGameState();
  const cards = selectedCards(gameState);
  const [card1, card2] = cards;

  return (
    <div>
      <h2>this round</h2>
      <div className="selected-cards">
        {card1 ? <Card card={card1}/> : <CardPlaceholder />}
        {card2 ? <Card card={card2}/> : <CardPlaceholder />}
      </div>
    </div>
  )
}

function ActiveCards() {
  const gameState = useGameState();
  const cards = activeCards(gameState);

  return (
    <div>
      <h2>active</h2>
      <div className="active-cards">
        {cards.map((c, i) => {
          return <Card key={i} card={c} />;
        })}
      </div>
    </div>
  )
}

function DiscardedCards() {
  const gameState = useGameState();
  const cards = discardedCards(gameState);
  console.log('discarded', cards);
  const dispatch = useGameDispatch();
  const canShortRest = cards.length > 1;

  function handleShortRest() {
    dispatch({
      kind: "short_rest_prepare",
    })
  }
  function handleShortRestConfirm() {
    dispatch({
      kind: "short_rest_confirm",
    })
  }
  function handleShortRestRedraw() {
    dispatch({
      kind: "short_rest_redraw",
    })
  }

  return (
    <div className="discarded-section">
      <h2>discarded</h2>
      <div className="mb" >
        {gameState.shortRestCandidateBurn ? (
          <>
            <button className="mr" onClick={handleShortRestConfirm}>burn "{gameState.shortRestCandidateBurn.card.name}"</button>
            <button onClick={handleShortRestRedraw}>redraw</button>
          </>
        )
        :(
          <button disabled={!canShortRest} onClick={handleShortRest}>short rest</button>
        )}
      </div>
      <div className="discarded-cards">
        {cards.map((c, i) => {
          return <Card key={i} card={c} />;
        })}
      </div>
    </div>
  )
}

function BurnedCards() {
  const gameState = useGameState();
  const cards = burnedCards(gameState);
  return (
    <div className="burned-section">
      <h2>burned</h2>
      <div className="burned-cards">
        {cards.map((c, i) => {
          return <Card key={i} card={c} />;
        })}
      </div>
    </div>
  )
}

function CharacterMat() {
  return (
    <img src={BANNERSPEAR_MAT} />
  )
}

type CharacterClass = "bannerspear";

type CardPlaceholder = {
  characterClass: CharacterClass;
  imgUrl: string;
}

type Card = {
  characterClass: CharacterClass;
  name: string;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'x';
  imgUrl: string;
}

type CardStatus = 'in hand' | 'selected' /* for play */ | 'active' | 'discarded' | 'burned';

type CardInPlay = {
  card: Card;
  status: CardStatus;
}

type CardOptions = {
  [action: string]: CardStatus;
}

function getOptions(card: CardInPlay, game: GameState): CardOptions {
  const selectedCount = game.deck.filter((c) => c.status === "selected").length;

  switch (card.status) {
    case 'in hand':
      const inHandOpts: CardOptions = {};
      if (selectedCount < 2) {
        inHandOpts.select = 'selected';
      }
      return {
        ...inHandOpts,
        discard: 'discarded',
        burn: 'burned',
      };
    case 'selected':
      // N.B.: we don't make a distinction here about whether or not the round has started
      return {
        unselect: 'in hand',
        activate: 'active',
        discard: 'discarded',
        burn: 'burned',
      }
    case "active":
      return {
        discard: 'discarded',
        burn: 'burned',
      }
    case "discarded":
      return {
        recover: 'in hand',
        burn: 'burned',
      }
    case "burned":
      return {
        recover: 'in hand',
      }    
  }
}

function CardPlaceholder() {
  return (
    <div className="card-wrapper">
      <img src={BANNERSPEAR_BACK} />
    </div>    
  )
}

function Card({card}: {card: CardInPlay}) {
  return (
    <div className="card-wrapper">
      <img src={card.card.imgUrl} />
      <CardOverlay card={card} />
    </div>
  );
}

function CardOverlay({ card }: { card: CardInPlay }) {
  const gameState = useGameState();
  const dispatch = useGameDispatch();
  const options = getOptions(card, gameState);
  function handleAction(e: React.MouseEvent<HTMLButtonElement>) {
    const newStatus = e.currentTarget.dataset['newStatus'] as CardStatus;
    dispatch({
      kind: "update",
      card,
      status: newStatus,
    })

  }
  return (
    <div className="card-overlay">
      <div className="card-overlay-actions" >
        {Object.entries(options).map(([action, status]) => {
          return <button data-new-status={status} key={action} onClick={handleAction}>{action}</button>
        })}
      </div>
    </div>
  )
}
