import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import shallowEqual from './utils/shallowEqual';
import wrapActionCreators from './utils/wrapActionCreators';
import getDisplayName from './utils/getDisplayName';
const hoistStatics = require('hoist-non-react-statics');
const invariant = require('fbjs/lib/invariant');
const objectAssign = require('object-assign');
const isPlainObject = require('lodash/isPlainObject');

import { State } from '../../reducers';

import {
  ApiCallSpec,
  ApiCall,
  ApiMethods,
  ApiCallOptions,
  makeInitialApiCall,
  ApiCallDictionary,
  ApiSpecDictionary,
} from '../core';

import {
  requestCall,
  referenceCall,
  unreferenceCall,
} from '../actions';

export interface ApiDispatchProps {
  request?: (apiCall: ApiCall<any>) => any;
}

/*
 * preloadApi decorator
 */

interface PreloadComponentProps extends RouteComponentProps<any, {}> {}

export interface MapParamsToProps<T> {
  (params: T, location: HistoryModule.Location): ApiSpecDictionary;
}

export function preloadApi<T>(mapParamsToProps: MapParamsToProps<T>) {
  return function wrapWithPreload(WrappedComponent) {
    const componentName = getDisplayName(WrappedComponent);

    invariant(WrappedComponent.__CONNECT_API__,
      `@preloadApi must be applied just before @connectApi on ${componentName}`
    );

    class Preload extends React.Component<PreloadComponentProps, {}> {
      static displayName = `Preload(${componentName})`;
      static mapParamsToProps = mapParamsToProps; // Expose mapper for server rendering

      constructor(props, context) {
        super(props, context);

        const { params, location } = props;
        invariant(params && location,
          `Route params and location object is unavailable in "${componentName}".` +
          `preload decorator must wrap react-router routing handlers.`
        );
      }

      render() {
        const { params, location } = this.props;
        const specs = mapParamsToProps(params, location) || {};
        return <WrappedComponent location={location} parentProps={this.props} preloadApiSpecs={specs} />
      }
    }

    return hoistStatics(Preload, WrappedComponent)
  }
}

/*
 * connectApi decorator
 */

interface ConnectApiContainerProps extends React.Props<{}> {
  location?: any;
  preloadApiSpecs?: ApiSpecDictionary;
  parentProps: any;
}

interface ConnectApiOwnProps extends React.Props<{}> {
  preloadApiSpecs: ApiSpecDictionary;
  parentProps: any;
  getInitialApiCall: (spec: ApiCallSpec) => ApiCall<any>;
  getNextCalls: (calls: ApiCallDictionary) => ApiCallDictionary;
  getNextStateProps: (stateProps: Object) => Object;
}

interface ConnectApiProps extends ConnectApiOwnProps {
  location?: any;
  stateProps?: any;
  dispatchProps?: any;
  calls?: ApiCallDictionary;
  preloadExpired?: boolean;
  requestCall?: (callId: string) => any;
  referenceCall?: (id: string, options: ApiCallOptions) => any;
  unreferenceCall?: (callIds: string[]) => any;
}

interface MapCallsToProps<T> {
  (state?: State, props?: T): ApiSpecDictionary;
}

interface MapStateToProps<T> {
  (state?: State, props?: T): any;
}

type MapDispatchToProps = (dispatch: any, props?: any) => any | { [index: string]: any };
type MapDispatchToPropsObject = { [index: string]: any };

const defaultMapStateToProps = state => ({});
const defaultMapDispatchToProps = dispatch => ({ dispatch });

const mapApiDispatchProps = wrapActionCreators({
  requestCall,
  referenceCall,
  unreferenceCall,
});

export function connectApi<T>(
  mapCallsToProps?: MapCallsToProps<T>,
  mapStateToProps?: MapStateToProps<T>,
  mapDispatchToProps?: MapDispatchToProps | MapDispatchToPropsObject
) {
  const mapState = mapStateToProps || defaultMapStateToProps;
  const mapDispatch: MapDispatchToProps = isPlainObject(mapDispatchToProps) ?
    wrapActionCreators(mapDispatchToProps) :
    mapDispatchToProps as MapDispatchToProps || defaultMapDispatchToProps;

  return function wrapWithConnectApi(WrappedComponent) {
    class ConnectApiContainer extends React.Component<ConnectApiContainerProps, {}> {
      static __CONNECT_API__ = true;
      static displayName = `ConnectApiContainer(${getDisplayName(WrappedComponent)})`;
      static mapCallsToProps = mapCallsToProps;

      initialApiCalls: ApiCallDictionary;
      calls: ApiCallDictionary;
      stateProps: Object;

      constructor(props, context) {
        super(props, context);
        this.initialApiCalls = {};
        this.calls = {};
        this.stateProps = {};
      }

      getInitialApiCall = (spec: ApiCallSpec): ApiCall<any> => {
        if (!this.initialApiCalls[spec.id]) {
          this.initialApiCalls[spec.id] = makeInitialApiCall(spec.id, spec.options, 'ready');
        }
        return this.initialApiCalls[spec.id];
      }

      getNextCalls = (calls: ApiCallDictionary): ApiCallDictionary => {
        if (!shallowEqual(this.calls, calls)) {
          this.calls = calls;
        }
        return this.calls;
      }

      getNextStateProps = (stateProps: any) => {
        if (!shallowEqual(this.stateProps, stateProps)) {
          this.stateProps = stateProps;
        }
        return this.stateProps;
      }

      render() {
        return (
          <ConnectApi location={this.props.location}
                      parentProps={this.props.parentProps || this.props}
                      preloadApiSpecs={this.props.preloadApiSpecs || {}}
                      getInitialApiCall={this.getInitialApiCall}
                      getNextCalls={this.getNextCalls}
                      getNextStateProps={this.getNextStateProps}
          />
        );
      }
    }

    @(connect((state: State, props: ConnectApiOwnProps) => {
      const specs: ApiSpecDictionary =
        mapCallsToProps ? mapCallsToProps(state, props.parentProps) : {};

      const stateProps = mapState(state, props.parentProps);
      const mergedSpecs = objectAssign({}, specs, props.preloadApiSpecs);

      const calls: ApiCallDictionary = {};
      Object.keys(mergedSpecs).forEach(key => {
        const spec = mergedSpecs[key];
        calls[key] = state.api.calls.get(spec.id) || props.getInitialApiCall(spec);
      });

      return {
        preloadExpired: state.api.preloadExpired,
        calls: props.getNextCalls(calls),
        stateProps: props.getNextStateProps(stateProps),
      };
    }, (dispatch, props: ConnectApiOwnProps) => {
      const apiDispatchProps = mapApiDispatchProps(dispatch);
      const dispatchProps = mapDispatch(dispatch, props);
      return objectAssign({}, apiDispatchProps, { dispatchProps });
    }) as any)
    class ConnectApi extends React.Component<ConnectApiProps, {}> {
      static displayName = `ConnectApi(${getDisplayName(WrappedComponent)})`;

      referencedCalls: { [index: string]: boolean };

      constructor(props, context) {
        super(props, context);
        this.referencedCalls = {};
      }

      request = (call: ApiCall<any>) => {
        if (this.props.calls[call.id]) {
          console.warn(`Call "${call.id}" is rejected because it is not registered`);
          return;
        }

        // Add reference
        if (!this.referencedCalls[call.id]) {
          this.referencedCalls[call.id] = true;
          this.props.referenceCall(call.id, call.options);
        }

        this.props.requestCall(call.id);
      }

      componentDidMount() {
        if (this.props.preloadExpired) {
          Object.keys(this.props.preloadApiSpecs).forEach(key => {
            const call = this.props.calls[key];
            this.request(call);
          });
        } else {
          Object.keys(this.props.preloadApiSpecs).forEach(key => {
            const spec = this.props.preloadApiSpecs[key];
            const call = this.props.calls[spec.id];
            this.props.referenceCall(spec.id, spec.options);
          });
        }
      }

      componentDidUpdate(prevProps: ConnectApiProps) {
        if (this.props.preloadExpired && prevProps.location !== this.props.location) {
          Object.keys(this.props.preloadApiSpecs).forEach(key => {
            const call = this.props.calls[key];
            this.request(call);
          });
        }
      }

      componentWillUnmount() {
        this.props.unreferenceCall(Object.keys(this.referencedCalls));
        this.referencedCalls = {};
      }

      render() {
        return (
          <WrappedComponent request={this.request}
                            {...this.props.calls}
                            {...this.props.stateProps}
                            {...this.props.dispatchProps}
                            {...this.props.parentProps}
          />
        );
      }
    }

    return hoistStatics(ConnectApiContainer, WrappedComponent)
  }
}
