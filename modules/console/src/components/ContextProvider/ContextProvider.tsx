import * as React from 'react';
const withContext = require('recompose/withContext').default;

interface ContextProviderProps {
  hairdresser: any;
  insertCss: any;
}

const ContextProvider: React.StatelessComponent<ContextProviderProps> = withContext(
  {
    hairdresser: React.PropTypes.object.isRequired,
    insertCss: React.PropTypes.func.isRequired,
  },
  ({
    hairdresser,
    insertCss,
  }: ContextProviderProps) => ({
    hairdresser,
    insertCss,
  })
)('div');

export default ContextProvider;
