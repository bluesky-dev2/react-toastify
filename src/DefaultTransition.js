import React from "react";
import Transition from "react-transition-group/Transition";
import { css } from "glamor";

import getAnimation from "./animation";

const animate = {
    animationDuration: "0.75s",
    animationFillMode: "both"
};

const animation = pos => {
  const { enter, exit } = getAnimation(pos);
  const enterKey = css.keyframes('enter', {
    "from, 60%, 75%, 90%, to": {
      animationTimingFunction: "cubic-bezier(0.215, 0.610, 0.355, 1.000)"
    },
    ...enter,
  });
  const exitKey = css.keyframes('exit', exit)
  
  return {
    enter: css({...animate, animationName: enterKey}),
    exit: css({...animate, animationName: exitKey}),
  };
}


function DefaultTransition({ children, position, ...props }) {
  const { enter, exit } = animation(position);

  return (
    <Transition
      {...props}
      timeout={750}
      onEnter={node => {
        node.classList.add(enter);
      }}
      onExit={node => {
        node.classList.remove(enter);
        node.classList.add(exit);
      }}
    >
      {children}
    </Transition>
  );
}

export default DefaultTransition;
