/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { first } from 'rxjs/operators';
import { APICaller } from 'kibana/server';
import { SearchResponse } from 'elasticsearch';
import { ES_SEARCH_STRATEGY } from '../../../common/search';
import { ISearchStrategy, TSearchStrategyProvider } from '../i_search_strategy';
import { getDefaultSearchParams, ISearchContext } from '..';

export const esSearchStrategyProvider: TSearchStrategyProvider<typeof ES_SEARCH_STRATEGY> = (
  context: ISearchContext,
  caller: APICaller
): ISearchStrategy<typeof ES_SEARCH_STRATEGY> => {
  return {
    search: async (request, options) => {
      const config = await context.config$.pipe(first()).toPromise();
      const defaultParams = getDefaultSearchParams(config);
      const params = {
        ...defaultParams,
        ...request.params,
      };
      const rawResponse = (await caller('search', params, options)) as SearchResponse<any>;

      // The above query will either complete or timeout and throw an error.
      // There is no progress indication on this api.
      const { total, failed, successful } = rawResponse._shards;
      const loaded = failed + successful;
      return { total, loaded, rawResponse };
    },
  };
};
