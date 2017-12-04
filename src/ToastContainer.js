import React, { Component, isValidElement, cloneElement } from "react";
import PropTypes from "prop-types";
import { css } from "glamor";
import TransitionGroup from "react-transition-group/TransitionGroup";

import Toast from "./Toast";
import DefaultCloseButton from "./DefaultCloseButton";
import DefaultTransition from "./DefaultTransition";
import { POSITION, ACTION } from "./constant";
import style from "./style";
import EventManager from "./util/EventManager";
import {
  falseOrNumber,
  falseOrElement,
  isValidDelay,
  objectValues
} from "./util/propValidator";

const container = disablePointer =>
  css({
    zIndex: style.zIndex,
    position: "fixed",
    padding: "4px",
    width: style.width,
    boxSizing: "border-box",
    color: "#fff",
    ...(disablePointer ? { pointerEvents: "none" } : {}),
    [`@media ${style.mobile}`]: {
      width: "100vw",
      padding: 0
    }
  });

const toastPosition = pos => {
  let rule;
  const marginLeft = `-${parseInt(style.width, 10) / 2}px`;
  switch (pos) {
    case POSITION.TOP_LEFT:
      rule = {
        top: "1em",
        left: "1em"
      };
      break;
    case POSITION.TOP_CENTER:
      rule = {
        top: "1em",
        left: "50%",
        marginLeft: marginLeft
      };
      break;
    case POSITION.TOP_RIGHT:
    default:
      rule = {
        top: "1em",
        right: "1em"
      };
      break;
    case POSITION.BOTTOM_LEFT:
      rule = {
        bottom: "1em",
        left: "1em"
      };
      break;
    case POSITION.BOTTOM_CENTER:
      rule = {
        bottom: "1em",
        left: "50%",
        marginLeft: marginLeft
      };
      break;
    case POSITION.BOTTOM_RIGHT:
      rule = {
        bottom: "1em",
        right: "1em"
      };
  }
  return css(
    rule,
    css({
      [`@media ${style.mobile}`]: {
        left: 0,
        margin: 0,
        position: "fixed",
        ...(pos.substring(0, 3) === "top" ? { top: 0 } : { bottom: 0 })
      }
    })
  );
};

const up = css.keyframes('up', {
  // "0%": {
  //   boxShadow: "0 0 0 0 rgba(204, 169, 44, 0.4)"
  // },
  // "70%": {
  //   boxShadow: "0 0 0 10px rgba(204, 169, 44, 0)"
  // },
  // "100%": {
  //   boxShadow: "0 0 0 0 rgba(204, 169, 44, 0)"
  // }
  "0%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(204, 169, 44, 0.4)" },
  "50%": { transform: "scale(1.1)", boxShadow: "0 0 0 10px rgba(204, 169, 44, 0)" },
  "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(204, 169, 44, 0)" },
});

const updateTransition = css({
  // borderRadius: "50%",
  // background: "#cca92c",
  // cursor: "pointer",
  // boxShadow: "0 0 0 rgba(204, 169, 44, 0.4)",
  // animation: `${up} 2s infinite`
  // transform: "scale(1.25)",
  // transition: "transform 3s"
  animation: `${up} 3s 3`
})

class ToastContainer extends Component {
  static propTypes = {
    /**
     * Set toast position
     */
    position: PropTypes.oneOf(objectValues(POSITION)),

    /**
     * Disable or set autoClose delay
     */
    autoClose: falseOrNumber,

    /**
     * Disable or set a custom react element for the close button
     */
    closeButton: falseOrElement,

    /**
     * Hide or not progress bar when autoClose is enabled
     */
    hideProgressBar: PropTypes.bool,

    /**
     * Pause toast duration on hover
     */
    pauseOnHover: PropTypes.bool,

    /**
     * Dismiss toast on click
     */
    closeOnClick: PropTypes.bool,

    /**
     * Newest on top
     */
    newestOnTop: PropTypes.bool,

    /**
     * An optional className
     */
    className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),

    /**
     * An optional style
     */
    style: PropTypes.object,

    /**
     * An optional className for the toast
     */
    toastClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),

    /**
     * An optional className for the toast body
     */
    bodyClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),

    /**
     * An optional className for the toast progress bar
     */
    progressClassName: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),

    /**
     * Define enter and exit transition using react-transition-group
     */
    transition: PropTypes.func,

    updateTransition: PropTypes.any
  };

  static defaultProps = {
    position: POSITION.TOP_RIGHT,
    transition: DefaultTransition,
    updateTransition: updateTransition,
    autoClose: 5000,
    hideProgressBar: false,
    closeButton: <DefaultCloseButton />,
    pauseOnHover: true,
    closeOnClick: true,
    newestOnTop: false,
    className: null,
    style: null,
    toastClassName: "",
    bodyClassName: "",
    progressClassName: ""
  };

  /**
   * Hold toast ids
   */
  state = {
    toast: [],
    isDocumentHidden: false
  };

  /**
   * Hold toast's informations:
   * - what to render
   * - position
   * - raw content
   * - options
   */
  collection = {};

  componentDidMount() {
    const { SHOW, CLEAR, MOUNTED } = ACTION;
    EventManager.on(SHOW, (content, options) => this.show(content, options))
      .on(CLEAR, id => (id !== null ? this.removeToast(id) : this.clear()))
      .emit(MOUNTED, this);
    document.addEventListener("visibilitychange", this.isDocumentHidden);
  }

  componentWillUnmount() {
    EventManager.off(ACTION.SHOW);
    EventManager.off(ACTION.CLEAR);
    document.removeEventListener("visibilitychange", this.isDocumentHidden);
  }

  isDocumentHidden = () => this.setState({ isDocumentHidden: document.hidden });

  isToastActive = id => this.state.toast.indexOf(parseInt(id, 10)) !== -1;

  removeToast(id) {
    this.setState({
      toast: this.state.toast.filter(v => v !== parseInt(id, 10))
    });
  }

  makeCloseButton(toastClose, toastId, type) {
    let closeButton = this.props.closeButton;

    if (isValidElement(toastClose) || toastClose === false) {
      closeButton = toastClose;
    }

    return closeButton === false
      ? false
      : cloneElement(closeButton, {
          closeToast: () => this.removeToast(toastId),
          type: type
        });
  }

  getAutoCloseDelay(toastAutoClose) {
    return toastAutoClose === false || isValidDelay(toastAutoClose)
      ? toastAutoClose
      : this.props.autoClose;
  }

  isFunction(object) {
    return !!(object && object.constructor && object.call && object.apply);
  }

  canBeRendered(content) {
    return (
      isValidElement(content) ||
      typeof content === "string" ||
      typeof content === "number"
    );
  }

  show(content, options) {
    if (!this.canBeRendered(content)) {
      throw new Error(
        `The element you provided cannot be rendered. You provided an element of type ${typeof content}`
      );
    }
    const toastId = options.toastId;
    const closeToast = () => this.removeToast(toastId);
    const toastOptions = {
      id: toastId,
      type: options.type,
      closeToast: closeToast,
      isUpdate: typeof this.collection[toastId] !== "undefined",
      position: options.position || this.props.position,
      transition: options.transition || this.props.transition,
      className: options.className || this.props.toastClassName,
      bodyClassName: options.bodyClassName || this.props.bodyClassName,
      closeButton: this.makeCloseButton(
        options.closeButton,
        toastId,
        options.type
      ),
      pauseOnHover:
        options.pauseOnHover !== null
          ? options.pauseOnHover
          : this.props.pauseOnHover,
      closeOnClick:
        options.closeOnClick !== null
          ? options.closeOnClick
          : this.props.closeOnClick,
      progressClassName:
        options.progressClassName || this.props.progressClassName,
      autoClose: this.getAutoCloseDelay(
        options.autoClose !== false
          ? parseInt(options.autoClose, 10)
          : options.autoClose
      ),
      hideProgressBar:
        typeof options.hideProgressBar === "boolean"
          ? options.hideProgressBar
          : this.props.hideProgressBar,
      updateTransition:
        options.updateTransition !== null
          ? options.updateTransition
          : this.props.updateTransition
    };

    this.isFunction(options.onOpen) && (toastOptions.onOpen = options.onOpen);

    this.isFunction(options.onClose) &&
      (toastOptions.onClose = options.onClose);

    /**
     * add closeToast function to react component only
     */
    if (
      isValidElement(content) &&
      typeof content.type !== "string" &&
      typeof content.type !== "number"
    ) {
      content = cloneElement(content, {
        closeToast
      });
    }

    this.collection = Object.assign({}, this.collection, {
      [toastId]: {
        position: toastOptions.position,
        options: toastOptions,
        content: content
      }
    });

    this.setState({
      toast: toastOptions.isUpdate
        ? [...this.state.toast]
        : [...this.state.toast, toastId]
    });
  }

  makeToast(content, options) {
    return (
      <Toast
        {...options}
        isDocumentHidden={this.state.isDocumentHidden}
        key={`toast-${options.id}`}
      >
        {content}
      </Toast>
    );
  }

  clear() {
    this.setState({ toast: [] });
  }

  renderToast() {
    const toastToRender = {};
    const { className, style, newestOnTop } = this.props;
    const collection = newestOnTop
      ? Object.keys(this.collection).reverse()
      : Object.keys(this.collection);

    collection.forEach(toastId => {
      const item = this.collection[toastId];
      toastToRender[item.position] || (toastToRender[item.position] = []);

      if (this.state.toast.indexOf(parseInt(toastId, 10)) !== -1) {
        toastToRender[item.position].push(
          this.makeToast(item.content, item.options)
        );
      } else {
        toastToRender[item.position].push(null);
        delete this.collection[toastId];
      }
    });

    return Object.keys(toastToRender).map(position => {
      const disablePointer =
        toastToRender[position].length === 1 &&
        toastToRender[position][0] === null;

      return (
        <TransitionGroup
          {...container(disablePointer)}
          {...toastPosition(position)}
          {...className !== null && { className }}
          {...style !== null && { style }}
          key={`container-${position}`}
        >
          {toastToRender[position]}
        </TransitionGroup>
      );
    });
  }

  render() {
    return <div>{this.renderToast()}</div>;
  }
}

export default ToastContainer;
