import * as React from 'react';
import Transition from 'react-transition-group/Transition';

type ToastType = 'info' | 'success' | 'warning' | 'error' | 'default';

type ToastContent = React.ReactNode | { (): void };

interface cssTransitionProps {
  /**
   * Css class to apply when toast enter
   */
  enter: string;

  /**
   * Css class to apply when toast leave
   */
  exit: string;

  /**
   * Define the duration of the transition in ms
   * `Default: 750`
   */
  duration?: number;

  /**
   * Append current toast position to the classname.
   * For instance `myclass--top-center`...
   * `Default: false`
   */
  appendPosition?: boolean;
};

interface CommonOptions {
  /**
   * Pause the timer when the mouse hover the toast.
   * `Default: true`
   */
  pauseOnHover?: boolean;

  /**
   * Remove the toast when clicked.
   * `Default: true`
   */
  closeOnClick?: boolean;

  /**
   * Set the delay in ms to close the toast automatically.
   * Use `false` to prevent the toast from closing.
   * `Default: 5000`
   */
  autoClose?: number | false;

  /**
   * Set the default position to use.
   * `One of: 'top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'`
   * `Default: 'top-right'`
   */
  position?: string;

  /**
   * Pass a custom close button.
   * To remove the close button pass `false`
   */
  closeButton?: React.ReactNode | false;

  /**
   * An optional css class to set for the progress bar.
   */
  progressClassName?: string;

  /**
   * An optional css class to set.
   */
  className?: string;

  /**
   * An optional css class to set for the toast content.
   */
  bodyClassName?: string;

  /**
   * Hide or show the progress bar.
   * `Default: false`
   */
  hideProgressBar?: boolean;

  /**
   * Pass a custom transition built with react-transition-group.
   */
  transition?: Transition;

  /**
   * Allow toast to be draggable
   * `Default: true`
   */
  draggable?: boolean;

  /**
   * The percentage of the toast's width it takes for a drag to dismiss a toast
   * `Default: 0.8`
   */
  draggablePercent?: number;
}

interface ToastOptions extends CommonOptions {
  /**
   * Called inside componentDidMount.
   */
  onOpen?: () => void;

  /**
   * Called inside componentWillUnMount.
   */
  onClose?: () => void;

  /**
   * Set the toast type.
   * `One of: 'info', 'success', 'warning', 'error', 'default'`
   */
  type?: ToastType;
}

interface UpdateOptions extends ToastOptions {
  /**
   * Used to update a toast.
   * Pass any valid ReactNode(string, number, component)
   */
  render?: ToastContent;
}

interface ToastContainerProps extends CommonOptions {
  /**
   * Whether or not to display the newest toast on top.
   * `Default: false`
   */
  newestOnTop?: boolean;

  /**
   * An optional inline style to apply.
   */
  style?: object;

  /**
   * An optional css class for the toast.
   */
  toastClassName?: string;

  /**
   * Support right to left display.
   * `Default: false`
   */
  rtl?: boolean;

  /**
   * Pause toast's timer on document visibility change
   * `Default: true`
   */
  pauseOnVisibilityChange?: boolean;
}

interface Toast {
  /**
   * Shorthand to display toast of type 'success'.
   */
  success(content: ToastContent, options?: ToastOptions): number;

  /**
   * Shorthand to display toast of type 'info'.
   */
  info(content: ToastContent, options?: ToastOptions): number;

  /**
   * Shorthand to display toast of type 'warning'.
   */
  warn(content: ToastContent, options?: ToastOptions): number;

  /**
   * Shorthand to display toast of type 'error'.
   */
  error(content: ToastContent, options?: ToastOptions): number;

  /**
   * Check if a toast is active by passing the `toastId`.
   * Each time you display a toast you receive a `toastId`.
   */
  isActive(toastId: number): boolean;

  /**
   * Remove a toast. If no `toastId` is used, all the active toast
   * will be removed.
   */
  dismiss(toastId?: number): void;

  /**
   * Update an existing toast. By default, we keep the initial content and options of the toast.
   */
  update(toastId: number, options?: UpdateOptions): void;

  /**
   * Listen for change when a toast is added or removed. The number of toast displayed is passed as paran to the callback
   */
  onChange(callback: ((count?: number) => void)): void;

  /**
   * Display a toast without a specific type.
   */
  (content: ToastContent, options?: ToastOptions): number;

  /**
   * Helper to set notification type
   */
  TYPE: {
    /**
     * Set notification type to `'info'`
     */
    INFO: string;

    /**
     * Set notification type to `'success'`
     */
    SUCCESS: string;

    /**
     * Set notification type to `'warning'`
     */
    WARNING: string;

    /**
     * Set notification type to `'error'`
     */
    ERROR: string;

    /**
     * Set notification type to `'default'`
     */
    DEFAULT: string;
  };

  /**
   * Helper to set position
   */
  POSITION: {
    /**
     * Set the position to `'top-left'`
     */
    TOP_LEFT: string;

    /**
     * Set the position to `'top-right'`
     */
    TOP_RIGHT: string;

    /**
     * Set the position to `'top-center'`
     */
    TOP_CENTER: string;

    /**
     * Set the position to `'bottom-left'`
     */
    BOTTOM_LEFT: string;

    /**
     * Set the position to `'bottom-right'`
     */
    BOTTOM_RIGHT: string;

    /**
     * Set the position to `'bottom-center'`
     */
    BOTTOM_CENTER: string;
  };
}

export class ToastContainer extends React.Component<ToastContainerProps> {}

/**
 * Helper to build custom entrance and exit transition
 */
export function cssTranstion(props: cssTransitionProps): () => void;

export let toast: Toast;
