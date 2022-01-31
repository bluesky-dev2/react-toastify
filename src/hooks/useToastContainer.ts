import {
  useEffect,
  useRef,
  useReducer,
  cloneElement,
  isValidElement
} from 'react';
import {
  parseClassName,
  canBeRendered,
  isBool,
  isFn,
  isNum,
  isStr,
  isToastIdValid,
  getAutoCloseDelay
} from '../utils';
import { eventManager, Event } from '../core/eventManager';

import {
  Id,
  ToastContainerProps,
  ToastProps,
  ToastContent,
  Toast,
  ToastPosition,
  ClearWaitingQueueParams,
  NotValidatedToastProps,
  ToastTransition
} from '../types';
import { useKeeper } from './useKeeper';
import { ActionType, reducer } from './toastContainerReducer';

interface QueuedToast {
  toastContent: ToastContent;
  toastProps: ToastProps;
  staleId?: Id;
}

export interface ContainerInstance {
  toastKey: number;
  displayedToast: number;
  props: ToastContainerProps;
  containerId?: Id | null;
  isToastActive: (toastId: Id) => boolean;
  getToast: (id: Id) => Toast | null | undefined;
}

export function useToastContainer(props: ToastContainerProps) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [toastIds, dispatch] = useReducer(reducer, []);
  const containerRef = useRef(null);
  let toastCount = useKeeper(0);
  let queue = useKeeper<QueuedToast[]>([]);
  const toastToRender = useRef(new Map<Id, Toast>()).current;
  const instance = useKeeper<ContainerInstance>({
    toastKey: 1,
    displayedToast: 0,
    props,
    containerId: null,
    isToastActive: isToastActive,
    getToast: id => toastToRender.get(id)
  });

  useEffect(() => {
    instance.containerId = props.containerId;
    eventManager
      .cancelEmit(Event.WillUnmount)
      .on(Event.Show, buildToast)
      .on(Event.Clear, toastId => containerRef.current && removeToast(toastId))
      .on(Event.ClearWaitingQueue, clearWaitingQueue)
      .emit(Event.DidMount, instance);

    return () => eventManager.emit(Event.WillUnmount, instance);
  }, []);

  useEffect(() => {
    instance.isToastActive = isToastActive;
    instance.displayedToast = toastIds.length;
    eventManager.emit(Event.Change, toastIds.length, props.containerId);
  }, [toastIds]);

  useEffect(() => {
    instance.props = props;
  });

  function isToastActive(id: Id) {
    return toastIds.indexOf(id) !== -1;
  }

  function clearWaitingQueue({ containerId }: ClearWaitingQueueParams) {
    const { limit } = instance.props;
    if (limit && (!containerId || instance.containerId === containerId)) {
      toastCount -= queue.length;
      queue = [];
    }
  }

  function removeToast(toastId?: Id) {
    dispatch({ type: ActionType.REMOVE, toastId });
  }

  function dequeueToast() {
    const { toastContent, toastProps, staleId } = queue.shift() as QueuedToast;
    appendToast(toastContent, toastProps, staleId);
  }

  /**
   * check if a container is attached to the dom
   * check for multi-container, build only if associated
   * check for duplicate toastId if no update
   */
  function isNotValid(options: NotValidatedToastProps) {
    return (
      !containerRef.current ||
      (instance.props.enableMultiContainer &&
        options.containerId !== instance.props.containerId) ||
      (toastToRender.has(options.toastId) && options.updateId == null)
    );
  }

  // this function and all the function called inside needs to rely on refs
  function buildToast(
    content: ToastContent,
    { delay, staleId, ...options }: NotValidatedToastProps
  ) {
    if (!canBeRendered(content) || isNotValid(options)) return;

    const { toastId, updateId, data } = options;
    const { props } = instance;
    const closeToast = () => removeToast(toastId);
    const isNotAnUpdate = updateId == null;

    if (isNotAnUpdate) toastCount++;

    const toastProps: ToastProps = {
      toastId,
      updateId,
      isLoading: options.isLoading,
      theme: options.theme || props.theme!,
      icon: options.icon != null ? options.icon : props.icon,
      isIn: false,
      key: options.key || instance.toastKey++,
      type: options.type!,
      closeToast: closeToast,
      closeButton: options.closeButton,
      rtl: props.rtl,
      position: options.position || (props.position as ToastPosition),
      transition: options.transition || (props.transition as ToastTransition),
      className: parseClassName(options.className || props.toastClassName),
      bodyClassName: parseClassName(
        options.bodyClassName || props.bodyClassName
      ),
      style: options.style || props.toastStyle,
      bodyStyle: options.bodyStyle || props.bodyStyle,
      onClick: options.onClick || props.onClick,
      pauseOnHover: isBool(options.pauseOnHover)
        ? options.pauseOnHover
        : props.pauseOnHover,
      pauseOnFocusLoss: isBool(options.pauseOnFocusLoss)
        ? options.pauseOnFocusLoss
        : props.pauseOnFocusLoss,
      draggable: isBool(options.draggable)
        ? options.draggable
        : props.draggable,
      draggablePercent: isNum(options.draggablePercent)
        ? options.draggablePercent
        : (props.draggablePercent as number),
      draggableDirection:
        options.draggableDirection || props.draggableDirection,
      closeOnClick: isBool(options.closeOnClick)
        ? options.closeOnClick
        : props.closeOnClick,
      progressClassName: parseClassName(
        options.progressClassName || props.progressClassName
      ),
      progressStyle: options.progressStyle || props.progressStyle,
      autoClose: options.isLoading
        ? false
        : getAutoCloseDelay(options.autoClose, props.autoClose),
      hideProgressBar: isBool(options.hideProgressBar)
        ? options.hideProgressBar
        : props.hideProgressBar,
      progress: options.progress,
      role: isStr(options.role) ? options.role : props.role,
      deleteToast() {
        removeFromCollection(toastId);
      }
    };

    if (isFn(options.onOpen)) toastProps.onOpen = options.onOpen;
    if (isFn(options.onClose)) toastProps.onClose = options.onClose;

    toastProps.closeButton = props.closeButton;

    if (options.closeButton === false || canBeRendered(options.closeButton)) {
      toastProps.closeButton = options.closeButton;
    } else if (options.closeButton === true) {
      toastProps.closeButton = canBeRendered(props.closeButton)
        ? props.closeButton
        : true;
    }

    let toastContent = content;

    if (isValidElement(content) && !isStr(content.type)) {
      toastContent = cloneElement(content, {
        closeToast,
        toastProps,
        data
      });
    } else if (isFn(content)) {
      toastContent = content({ closeToast, toastProps, data });
    }

    // not handling limit + delay by design. Waiting for user feedback first
    if (
      props.limit &&
      props.limit > 0 &&
      toastCount > props.limit &&
      isNotAnUpdate
    ) {
      queue.push({ toastContent, toastProps, staleId });
    } else if (isNum(delay) && (delay as number) > 0) {
      setTimeout(() => {
        appendToast(toastContent, toastProps, staleId);
      }, delay);
    } else {
      appendToast(toastContent, toastProps, staleId);
    }
  }

  function appendToast(
    content: ToastContent,
    toastProps: ToastProps,
    staleId?: Id
  ) {
    const { toastId } = toastProps;

    if (staleId) toastToRender.delete(staleId);

    toastToRender.set(toastId, {
      content,
      props: toastProps
    });
    dispatch({
      type: ActionType.ADD,
      toastId,
      staleId
    });
  }

  function removeFromCollection(toastId: Id) {
    toastToRender.delete(toastId);
    const queueLen = queue.length;
    toastCount = isToastIdValid(toastId)
      ? toastCount - 1
      : toastCount - instance.displayedToast;

    if (toastCount < 0) toastCount = 0;

    if (queueLen > 0) {
      const freeSlot = isToastIdValid(toastId) ? 1 : instance.props.limit!;

      if (queueLen === 1 || freeSlot === 1) {
        instance.displayedToast++;
        dequeueToast();
      } else {
        const toDequeue = freeSlot > queueLen ? queueLen : freeSlot;
        instance.displayedToast = toDequeue;

        for (let i = 0; i < toDequeue; i++) dequeueToast();
      }
    } else {
      forceUpdate();
    }
  }

  function getToastToRender<T>(
    cb: (position: ToastPosition, toastList: Toast[]) => T
  ) {
    const toRender = new Map<ToastPosition, Toast[]>();
    const collection = Array.from(toastToRender.values());

    if (props.newestOnTop) collection.reverse();

    collection.forEach(toast => {
      const { position } = toast.props;
      toRender.has(position) || toRender.set(position, []);
      toRender.get(position)!.push(toast);
    });

    return Array.from(toRender, p => cb(p[0], p[1]));
  }

  return {
    getToastToRender,
    containerRef,
    isToastActive
  };
}
