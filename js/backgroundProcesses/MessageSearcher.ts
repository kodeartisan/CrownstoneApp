import { BatchCommandHandler } from '../logic/BatchCommandHandler'
import { LOG }                 from "../logging/Log";
import { eventBus }            from "../util/EventBus";
import {NativeBus} from "../native/libInterface/NativeBus";
import {CLOUD} from "../cloud/cloudAPI";
import {LocalNotifications} from "../notifications/LocalNotifications";
import {Util} from "../util/Util";

class MessageSearcherClass {
  _initialized: boolean = false;
  _store: any;

  constructor() { }

  _loadStore(store: any) {
    LOG.info('LOADED STORE MessageSearcher', this._initialized);
    if (this._initialized === false) {
      this._store = store;

      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => { this._enterSphere(sphereId); });
      NativeBus.on(NativeBus.topics.exitSphere,  (sphereId) => { this._exitSphere(sphereId); });
      NativeBus.on(NativeBus.topics.enterRoom,   (data)     => { this._enterRoom(data); }); // data = {region: sphereId, location: locationId}
      NativeBus.on(NativeBus.topics.exitRoom,    (data)     => { this._exitRoom(data); });  // data = {region: sphereId, location: locationId}

    }
    this._initialized = true;
  }

  _isMessageEqual(dbMessage, cloudMessage, cloudRecipientIds) {
    if (dbMessage.everyoneInSphere === cloudMessage.everyoneInSphere &&
       (dbMessage.content          === cloudMessage.content) &&
        (
          (dbMessage.triggerLocationId === null && cloudMessage.triggerLocationId === undefined) ||
          (dbMessage.triggerLocationId === cloudMessage.triggerLocationId)
        )
        ) {

      let dbRecipientIds = Object.keys(dbMessage.recipients);
      if (dbRecipientIds.length === cloudRecipientIds.length) {
        for (let i = 0; i < dbRecipientIds.length; i++) {
          if (cloudRecipientIds.indexOf(dbRecipientIds[i]) === -1) {
            return false;
          }
        }
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }

    return true;
  }

  _processMessage(actions, state, message) {
    let notified = LocalNotifications._handleNewMessage(message, state);
    if (notified) {
      let recipientIds = [];
      message.recipients.forEach((idObject) => {
        recipientIds.push(idObject.id);
      });

      let dbMessageId = Util.getUUID();
      if (message.ownerId === state.user.userId) {
        let dbMessages = state.sphere[message.sphereId].messages;
        // this should check if we already have this message before storing it in the store.
        // match recipients, content, triggerLocationId and triggerEvent for this.
        let dbMessageIds = Object.keys(dbMessages);
        for (let i = 0; i < dbMessageIds.length; i++) {
          let dbMessage = dbMessages[dbMessageIds[i]];
          let match = this._isMessageEqual(dbMessage, message, recipientIds);
          if (match) {
            dbMessageId = dbMessageIds[i];
            break;
          }
        }
      }

      // add message to the store
      actions.push({
        type:'ADD_CLOUD_MESSAGE',
        sphereId: message.sphereId,
        messageId: dbMessageId,
        data: {
          senderId: message.ownerId,
          cloudId: message.id,
          content: message.content,
          triggerEvent: message.triggerEvent,
          triggerLocationId: message.triggerLocationId,
          recipientIds: recipientIds,
          sent: true,
        }
      });

      // indicate that you have received this message
      actions.push({
        type:'I_RECEIVED_MESSAGE',
        sphereId: message.sphereId,
        messageId: dbMessageId,
        data: {
          userId: state.user.userId,
          at: new Date().valueOf(),
        }
      });

      // put the cloud's knowledge of the delivered state in the local database.
      if (message.delivered) {
        message.delivered.forEach((delivered) => {
          actions.push({
            type:'RECEIVED_MESSAGE',
            sphereId: message.sphereId,
            messageId: dbMessageId,
            data: {
              userId: delivered.userId,
              at: new Date(delivered.timestamp).valueOf(),
            }
          });
        })
      }

      // put the cloud's knowledge of the read state in the local database.
      if (message.read) {
        message.read.forEach((read) => {
          actions.push({
            type:'READ_MESSAGE',
            sphereId: message.sphereId,
            messageId: dbMessageId,
            data: {
              userId: read.userId,
              at: new Date(read.timestamp).valueOf(),
            }
          });
        })
      }
    }
  }

  _enterSphere(sphereId) {
    this._handleMessageInSphere(sphereId, 'enter');
  }

  _exitSphere(sphereId) {
    this._handleMessageInSphere(sphereId, 'exit');
  }

  _enterRoom(data) {
    this._handleMessageInLocation(data.region, data.location, 'enter');
  }

  _exitRoom(data) {
    this._handleMessageInLocation(data.region, data.location, 'exit');
  }

  _handleMessageInLocation(sphereId, locationId, triggerEvent) {
    let state = this._store.getState();
    CLOUD.forSphere(sphereId).getNewMessagesInLocation(locationId)
      .then((messages) => {
        if (messages && Array.isArray(messages)) {
          let actions = [];
          messages.forEach((message) => {
            if (message.triggerEvent === triggerEvent) {
              this._processMessage(actions, state, message);
            }
          })
        }
      })
      .catch((err) => {})
  }

  _handleMessageInSphere(sphereId, triggerEvent) {
    let state = this._store.getState();
    CLOUD.forSphere(sphereId).getNewMessagesInSphere()
      .then((messages) => {
        if (messages && Array.isArray(messages)) {
          let actions = [];
          messages.forEach((message) => {
            if (message.triggerEvent === triggerEvent) {
              this._processMessage(actions, state, message);
            }
          })
        }
      })
      .catch((err) => {})
  }
}

export const MessageSearcher = new MessageSearcherClass();