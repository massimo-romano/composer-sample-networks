/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/* global getCurrentParticipant getParticipantRegistry getFactory emit */

/**
 * A Member grants access to their record to another Member.
 * @param {org.acme.pii.AuthorizeAccess} authorize - the authorize to be processed
 * @transaction
 */
async function authorizeAccess(authorize) {  // eslint-disable-line no-unused-vars

    const me = getCurrentParticipant();
    console.log('**** AUTH: ' + me.getIdentifier() + ' granting access to ' + authorize.memberId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is not already authorized, we authorize them
    let index = -1;

    if(!me.authorized) {
        me.authorized = [];
    }
    else {
        index = me.authorized.indexOf(authorize.memberId);
    }

    if(index < 0) {
        me.authorized.push(authorize.memberId);

        // emit an event
        const event = getFactory().newEvent('org.acme.pii', 'MemberEvent');
        event.memberTransaction = authorize;
        emit(event);

        // persist the state of the member
        const memberRegistry = await getParticipantRegistry('org.acme.pii.Member');
        await memberRegistry.update(me);
    }
}

/**
 * A Member revokes access to their record from another Member.
 * @param {org.acme.pii.RevokeAccess} revoke - the RevokeAccess to be processed
 * @transaction
 */
async function revokeAccess(revoke) {  // eslint-disable-line no-unused-vars

    const me = getCurrentParticipant();
    console.log('**** REVOKE: ' + me.getIdentifier() + ' revoking access to ' + revoke.memberId );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is authorized, we remove them
    const index = me.authorized ? me.authorized.indexOf(revoke.memberId) : -1;

    if(index>-1) {
        me.authorized.splice(index, 1);

        // emit an event
        const event = getFactory().newEvent('org.acme.pii', 'MemberEvent');
        event.memberTransaction = revoke;
        emit(event);

        // persist the state of the member
        const memberRegistry = await getParticipantRegistry('org.acme.pii.Member');
        await memberRegistry.update(me);
    }
}