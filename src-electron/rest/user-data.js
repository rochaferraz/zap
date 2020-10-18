/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * This module provides the REST API to the user specific data.
 *
 * @module REST API: user data
 */

const env = require('../util/env.js')
const queryConfig = require('../db/query-config.js')
const queryPackage = require('../db/query-package.js')
const validation = require('../validation/validation.js')
const restApi = require('../../src-shared/rest-api.js')

/**
 * HTTP GET: session key values
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetSessionKeyValues(db) {
  return (request, response) => {
    var sessionId = request.session.zapSessionId
    queryConfig
      .getAllSessionKeyValues(db, sessionId)
      .then((sessionKeyValues) =>
        response.status(restApi.httpCode.ok).json(sessionKeyValues)
      )
  }
}

/**
 * HTTP DELETE: endpoint
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpDeleteEndpoint(db) {
  return (request, response) => {
    var id = request.query.id
    queryConfig.deleteEndpoint(db, id).then((removed) => {
      response.json({
        successful: removed > 0,
        id: id,
      })
      return response.status(restApi.httpCode.ok).send()
    })
  }
}

/**
 * HTTP POST: save session key value
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostSaveSessionKeyValue(db) {
  return (request, response) => {
    var { key, value } = request.body
    var sessionId = request.session.zapSessionId
    env.logInfo(`[${sessionId}]: Saving: ${key} => ${value}`)
    queryConfig
      .updateKeyValue(db, sessionId, key, value)
      .then(() => {
        response.json({
          key: key,
          value: value,
        })
        response.status(restApi.httpCode.ok).send()
      })
      .catch((err) => {
        throw err
      })
  }
}

/**
 * HTTP POST: cluster
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCluster(db) {
  return (request, response) => {
    var { id, side, flag, endpointTypeId } = request.body

    queryConfig
      .getClusterState(db, endpointTypeId, id, side)
      .then((clusterState) => {
        return clusterState == null ? true : false
      })
      .then((insertDefaults) => {
        return queryConfig
          .insertOrReplaceClusterState(db, endpointTypeId, id, side, flag)
          .then(() => {
            if (insertDefaults) {
              return queryConfig.insertClusterDefaults(db, endpointTypeId, {
                clusterRef: id,
                side: side,
              })
            } else {
              return Promise.resolve()
            }
          })
          .then(() =>
            response
              .json({
                replyId:
                  restApi.replyId.zclEndpointTypeClusterSelectionResponse,
                endpointTypeId: endpointTypeId,
                id: id,
                side: side,
                flag: flag,
              })
              .status(restApi.httpCode.ok)
              .send()
          )
          .catch((err) => response.status(restApi.httpCode.badRequest).send())
      })
  }
}

/**
 * HTTP POST attribute update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostAttributeUpdate(db) {
  return (request, response) => {
    var {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      attributeSide,
    } = request.body
    var param = ''
    var paramType = ''
    switch (listType) {
      case 'selectedAttributes':
        param = 'INCLUDED'
        break
      case 'selectedSingleton':
        param = 'SINGLETON'
        break
      case 'selectedBounded':
        param = 'BOUNDED'
        break
      case 'defaultValue':
        param = 'DEFAULT_VALUE'
        paramType = 'text'
        break
      case 'selectedReporting':
        param = 'INCLUDED_REPORTABLE'
        break
      case 'reportingMin':
        param = 'MIN_INTERVAL'
        break
      case 'reportingMax':
        param = 'MAX_INTERVAL'
        break
      case 'reportableChange':
        param = 'REPORTABLE_CHANGE'
        break
      case 'storageOption':
        param = 'STORAGE_OPTION'
        paramType = 'text'
        break
      default:
        break
    }
    queryConfig
      .insertOrUpdateAttributeState(
        db,
        endpointTypeId,
        clusterRef,
        attributeSide,
        id,
        [{ key: param, value: value, type: paramType }]
      )
      .then((row) =>
        validation
          .validateAttribute(db, endpointTypeId, id, clusterRef)
          .then((validationData) => {
            response.json({
              action: action,
              endpointTypeId: endpointTypeId,
              clusterRef: clusterRef,
              id: id,
              added: value,
              listType: listType,
              validationIssues: validationData,
              replyId: restApi.replyId.singleAttributeState,
            })
            return response.status(restApi.httpCode.ok).send()
          })
      )
  }
}

/**
 * HTTP POST: command update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCommandUpdate(db) {
  return (request, response) => {
    var {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      commandSide,
    } = request.body
    var isIncoming = null

    switch (listType) {
      case 'selectedIn':
        isIncoming = true
        break
      case 'selectedOut':
        isIncoming = false
        break
      default:
        break
    }
    queryConfig
      .insertOrUpdateCommandState(
        db,
        endpointTypeId,
        clusterRef,
        commandSide,
        id,
        value,
        isIncoming
      )
      .then(() => {
        response.json({
          action: action,
          endpointTypeId: endpointTypeId,
          id: id,
          added: value,
          listType: listType,
          side: commandSide,
          clusterRef: clusterRef,
          replyId: restApi.replyId.singleCommandState,
        })
        return response.status(restApi.httpCode.ok).send()
      })
  }
}

/**
 * HTTP POST: endpoint
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostEndpoint(db) {
  return (request, response) => {
    var { action, context } = request.body
    var sessionIdexport = request.session.zapSessionId
    switch (action) {
      case restApi.action.create:
        queryConfig
          .insertEndpoint(
            db,
            sessionIdexport,
            context.eptId,
            context.endpointType,
            context.nwkId
          )
          .then((newId) => {
            return validation
              .validateEndpoint(db, newId)
              .then((validationData) => {
                response.json({
                  action: action,
                  id: newId,
                  eptId: context.eptId,
                  endpointType: context.endpointType,
                  nwkId: context.nwkId,
                  replyId: restApi.replyId.zclEndpointResponse,
                  validationIssues: validationData,
                })
                return response.status(restApi.httpCode.ok).send()
              })
          })
          .catch((err) => {
            return response.status(restApi.httpCode.badRequest).send()
          })
        break
      case restApi.action.update:
        let changes = context.changes.map((data) => {
          var changeParam = ''
          var paramType = ''
          switch (data.updatedKey) {
            case restApi.updateKey.endpointId:
              changeParam = 'ENDPOINT_IDENTIFIER'
              break
            case restApi.updateKey.endpointType:
              changeParam = 'ENDPOINT_TYPE_REF'
              break
            case restApi.updateKey.networkId:
              changeParam = 'NETWORK_IDENTIFIER'
              break
          }
          return { key: changeParam, value: data.value, type: paramType }
        })

        queryConfig
          .updateEndpoint(db, sessionIdexport, context.id, changes)
          .then((data) => {
            return validation
              .validateEndpoint(db, context.id)
              .then((validationData) => {
                response.json({
                  action: restApi.action.update,
                  endpointId: context.id,
                  changes: context.changes,
                  replyId: restApi.replyId.zclEndpointResponse,
                  validationIssues: validationData,
                })
                return response.status(restApi.httpCode.ok).send()
              })
          })
        break
      default:
        break
    }
  }
}
/**
 * HTTP GET: initial state
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetInitialState(db) {
  return (request, response) => {
    var sessionId = request.session.zapSessionId
    var state = {}

    var statePopulators = []
    var endpointTypes = queryConfig
      .getAllEndpointTypes(db, sessionId)
      .then((rows) => {
        state.endpointTypes = rows
      })
    statePopulators.push(endpointTypes)

    var endpoints = queryConfig.getAllEndpoints(db, sessionId).then((rows) => {
      state.endpoints = rows
    })
    statePopulators.push(endpoints)

    var sessionKeyValues = queryConfig
      .getAllSessionKeyValues(db, sessionId)
      .then((rows) => {
        state.sessionKeyValues = rows
      })
    statePopulators.push(sessionKeyValues)

    Promise.all(statePopulators).then(() => {
      return response.status(restApi.httpCode.ok).json({
        replyId: restApi.replyId.initialState,
        state: state,
      })
    })
  }
}

/**
 * HTTP POST endpoint type
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostEndpointType(db) {
  return (request, response) => {
    var { action, context } = request.body
    var sessionId = request.session.zapSessionId
    switch (action) {
      case restApi.action.create:
        queryConfig
          .insertEndpointType(
            db,
            sessionId,
            context.name,
            context.deviceTypeRef
          )
          .then((newId) => {
            response.json({
              action: action,
              id: newId,
              name: context.name,
              deviceTypeRef: context.deviceTypeRef,
              replyId: restApi.replyId.zclEndpointTypeResponse,
            })
            return response.status(restApi.httpCode.ok).send()
          })
          .catch((err) => {
            return response.status(restApi.httpCode.badRequest).send()
          })
        break
      case restApi.action.delete:
        queryConfig.deleteEndpointType(db, context.id).then((removed) => {
          response.json({
            action: action,
            successful: removed > 0,
            id: context.id,
            replyId: restApi.replyId.zclEndpointTypeResponse,
          })
          return response.status(restApi.httpCode.ok).send()
        })
        break
      default:
        break
    }
  }
}

/**
 * HTTP POST: endpoint type update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostEndpointTypeUpdate(db) {
  return (request, response) => {
    var { action, endpointTypeId, updatedKey, updatedValue } = request.body
    var sessionId = request.session.zapSessionId

    var param = ''
    switch (updatedKey) {
      case restApi.updateKey.deviceTypeRef:
        param = 'DEVICE_TYPE_REF'
        break
      case restApi.updateKey.name:
        param = 'NAME'
        break
      default:
        break
    }

    queryConfig
      .updateEndpointType(db, sessionId, endpointTypeId, param, updatedValue)
      .then(() => {
        response.json({
          action: action,
          endpointTypeId: endpointTypeId,
          updatedKey: updatedKey,
          updatedValue: updatedValue,
          replyId: restApi.replyId.zclEndpointTypeResponse,
        })
        return response.status(restApi.httpCode.ok).send()
      })
  }
}

/**
 * HTTP GET: option
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetOption(db) {
  return (request, response) => {
    var sessionId = request.session.zapSessionId
    const { option } = request.params
    queryPackage.getSessionPackageIds(db, sessionId).then((packageIds) => {
      var p = packageIds.map((packageId) => {
        return queryPackage.selectAllOptionsValues(db, packageId, option)
      })
      Promise.all(p)
        .then((data) => data.flat(1))
        .then((data) => {
          return response.status(restApi.httpCode.ok).json({
            data: data,
            option: option,
            replyId: 'option',
          })
        })
    })
  }
}

exports.post = [
  {
    uri: restApi.uri.cluster,
    callback: httpPostCluster,
  },
  {
    uri: restApi.uri.attributeUpdate,
    callback: httpPostAttributeUpdate,
  },
  {
    uri: restApi.uri.commandUpdate,
    callback: httpPostCommandUpdate,
  },
  {
    uri: restApi.uri.saveSessionKeyValue,
    callback: httpPostSaveSessionKeyValue,
  },
  {
    uri: restApi.uri.endpoint,
    callback: httpPostEndpoint,
  },
  {
    uri: restApi.uri.endpointType,
    callback: httpPostEndpointType,
  },
  {
    uri: restApi.uri.endpointTypeUpdate,
    callback: httpPostEndpointTypeUpdate,
  },
]

exports.get = [
  {
    uri: restApi.uri.getAllSessionKeyValues,
    callback: httpGetSessionKeyValues,
  },
  {
    uri: restApi.uri.initialState,
    callback: httpGetInitialState,
  },
  {
    uri: `${restApi.uri.option}/:option`,
    callback: httpGetOption,
  },
]

exports.delete = [
  {
    uri: restApi.uri.endpoint,
    callback: httpDeleteEndpoint,
  },
]
