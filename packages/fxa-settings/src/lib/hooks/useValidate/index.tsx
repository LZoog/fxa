/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// import { useEffect, useState } from 'react';
// import { UrlQueryData } from '../../model-data';
// import { ReachRouterWindow } from '../../window';

// let urlQueryDataInstance: UrlQueryData;

// TODO this hook once class-validator is merged

export function useValidatedQueryParams<T extends Record<string, any>>(
  // QueryParamModel: new () => T
  QueryParamModel: any
) {
  // const [state, setState] = useState<{
  //   queryParams: T | null;
  //   queryParamErrors: Record<string, string> | null;
  // }>({ queryParams: null, queryParamErrors: null });

  // if (!urlQueryDataInstance) {
  //   urlQueryDataInstance = new UrlQueryData(new ReachRouterWindow());
  // }
  return {
    queryParams: {
      email: 'blabidi@blabidiboo.com',
      emailFromContent: 'true',
    },
    queryParamErrors: null,
  };

  // useEffect(() => {
  //   const model = new QueryParamModel();

  //   for (let key of Object.keys(model)) {
  //     const value = urlQueryDataInstance.get(key);
  //     if (value) {
  //       (model as any)[key] = value;
  //     }
  //   }

  //   validate(model).then((validationErrors) => {
  //     const queryParamErrors: Record<string, any> = {};
  //     validationErrors.forEach((error: ValidationError) => {
  //       if (error.constraints) {
  //         queryParamErrors[error.property] = Object.values(
  //           error.constraints
  //         )[0];
  //       }
  //     });
  //     setState({
  //       queryParams: schema,
  //       queryParamErrors: Object.keys(queryParamErrors).length
  //         ? queryParamErrors
  //         : null,
  //     });
  //   });
  // }, [Schema, urlQueryData]);

  // return state;
}
