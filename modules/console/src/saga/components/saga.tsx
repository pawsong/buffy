import * as React from 'react'
import { Saga, Task } from 'redux-saga';
import { call } from 'redux-saga/effects';

import * as invariant from 'invariant';
const hoistStatics = require('hoist-non-react-statics');
const objectAssign = require('object-assign');

import { UnlistenableTask, ImmutableTask, isRunning } from '../core';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export interface SagaProps {
  cancelSaga?: (sagaTask: ImmutableTask<any>) => any;
  runSaga?: (sagaTask: ImmutableTask<any>, ...args) => any;
}

interface SagaDictionary {
  [index: string]: (...args) => IterableIterator<any>;
}

interface SagaComponentState {
  [index: string]: ImmutableTask<any>
}

function filterGetState(saga) {
  return function* (getState, ...args) {
    yield* saga(...args);
  };
}

export default function saga(options: SagaDictionary) {
  const sagas = {};
  Object.keys(options).forEach(key => {
    const saga = options[key];
    sagas[key] = filterGetState(saga);
  });

  return function wrapWithSaga(WrappedComponent) {
    class SagaComponent extends React.Component<{}, SagaComponentState> {
      static displayName = `Saga(${getDisplayName(WrappedComponent)})`

      static contextTypes = {
        middleware: React.PropTypes.func.isRequired,
      }

      middleware: any;

      constructor(props, context) {
        super(props, context);
        this.middleware = this.context['middleware'];

        invariant(this.middleware,
          `Could not find "middleware" in the context of "${SagaComponent.displayName}". ` +
          `Wrap the root component in a <SagaProvider>.`
        );

        this.state = {};
        Object.keys(sagas).forEach(key => {
          this.state[key] = {
            name: key,
            state: 'ready',
          };
        });
      }

      cancelSaga = (sagaTask: ImmutableTask<any>) => {
        if (sagaTask.task) { sagaTask.task.cancel(); }
      }

      runSaga = (sagaTask: ImmutableTask<any>, ...args) => {
        this.cancelSaga(sagaTask);

        const saga = sagas[sagaTask.name];
        const task = new UnlistenableTask(this.middleware.run(saga, ...args));
        task
          .onThen(result => this.setState({
            [sagaTask.name]: {
              name: sagaTask.name,
              state: 'done',
              result: result,
              task: task,
            },
          }))
          .onCatch(error => this.setState({
            [sagaTask.name]: {
              name: sagaTask.name,
              state: 'done',
              error: error,
              task: task,
            },
          }));

        this.setState({
          [sagaTask.name]: {
            name: sagaTask.name,
            state: 'running',
            task: task,
          },
        });
      }

      componentWillUnmount() {
        Object.keys(this.state).forEach(key => {
          const sagaTask = this.state[key];
          if (sagaTask.task) { sagaTask.task.unlisten(); }
        });
      }

      render() {
        return <WrappedComponent cancelSaga={this.cancelSaga} runSaga={this.runSaga} {...this.state} {...this.props} />
        // return createElement(WrappedComponent, this.props);
      }
    }

    return hoistStatics(SagaComponent, WrappedComponent);
  };
}
