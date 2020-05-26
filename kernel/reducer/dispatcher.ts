export interface Dispatcher<T> {
  dispatch(action: T): void;
}
