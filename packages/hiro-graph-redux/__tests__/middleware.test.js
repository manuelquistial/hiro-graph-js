/* eslint-env jest */
// this is going to be crazy complex
import createReduxStoreAndClient from "../__mocks__/store";
import {
    createTeam,
    createAccount,
    createProfile
} from "../__mocks__/mappings";
import {
    createTask,
    whenTask,
    loginTaskSelector,
    createVertexSelector,
    doLogin,
    getMyId
} from "../src/index";

describe("testing test setup", () => {
    const { client, store } = createReduxStoreAndClient();

    let unsub;
    afterEach(() => {
        if (typeof unsub === "function") {
            unsub();
        }
        client.resetMockTransport();
    });

    it("should be able to login", () => {
        const me = getMyId(store.getState());
        expect(me).toBeFalsy();
        store.dispatch(doLogin());
        // in order to wait until this works,
        // we check the
        return new Promise((resolve, reject) => {
            unsub = store.subscribe(() => {
                whenTask(loginTaskSelector(store.getState()), {
                    ok: () => {
                        const myId = getMyId(store.getState());
                        expect(myId).toBeTruthy();
                        expect(myId).toBe("me-account");
                        unsub();
                        unsub = undefined;
                        resolve();
                    },
                    error: err => {
                        unsub();
                        unsub = undefined;
                        reject(err);
                    }
                });
            });
        });
    });

    it("Verify Bug: fetch relation (1 result), disconnect (0 results), connect (still 0 results)", async () => {
        const rel = "teams";
        const relIds = rel + "Ids";

        const relationTask = createTask(orm => {
            // the "me" should be cached and not hit the client at all...
            // so we just need the gremlin response.
            client.enqueueMockResponse({
                account: createAccount("me"),
                profile: createProfile("me"),
                avatar: ""
            });

            return orm.me().then(({ account: me }) => {
                expect(me).toBeTruthy();
                expect(me._id).toBe("me-account");

                client.enqueueMockResponse([createTeam("team1")]);

                return orm.fetchVertices([rel])(me);
            });
        });

        const emptyArray = [];
        const relationVertexSelector = createVertexSelector(state => {
            const relTask = relationTask.selector(state);
            if (relTask) {
                return relTask.result._rel[relIds];
            }
            return emptyArray;
        });

        const disconnectTask = createTask(orm => {
            client.enqueueMockResponse({
                account: createAccount("me"),
                profile: createProfile("me"),
                avatar: ""
            });

            client.enqueueMockResponse(
                {}, // it is actually irrelevant as long as it isn't an error.
                [] // this one is the new "relation" query result
            );

            return orm
                .me()
                .then(({ account: me }) => me.disconnect(rel, "me-account"));
        });

        const connectTask = createTask(orm => {
            client.enqueueMockResponse({
                account: createAccount("me"),
                profile: createProfile("me"),
                avatar: ""
            });

            return orm.me().then(({ account: me }) => {
                client.enqueueMockResponse(
                    {}, // it is actually irrelevant as long as it isn't an error.
                    [createTeam("team3")] // this one is the new "relation" query result
                );

                return me.connect(
                    rel,
                    "team3"
                );
            });
        });

        let res, v;

        // dispatch the action
        await store.dispatch(relationTask.action());

        //now we have finished, we should be able to select the result.
        res = relationTask.selector(store.getState());
        expect(whenTask(res, { ok: () => true })).toBe(true);
        expect(res.result._rel[relIds]).toEqual(["team1"]);

        v = relationVertexSelector(store.getState());
        expect(v.length).toEqual(1);
        expect(v.map(n => n._id)).toEqual(["team1"]);

        // now we dispatch the disconnect.
        await store.dispatch(disconnectTask.action());

        res = disconnectTask.selector(store.getState());
        expect(whenTask(res, { ok: () => true })).toBe(true);
        expect(res.result._rel[relIds]).toEqual([]);

        v = relationVertexSelector(store.getState());
        expect(v.length).toEqual(0);
        expect(v.map(n => n._id)).toEqual([]);

        // now we dispatch the reconnect.
        await store.dispatch(connectTask.action());

        res = connectTask.selector(store.getState());
        expect(whenTask(res, { ok: () => true })).toBe(true);

        // THIS IS WHERE THE BUG WAS

        expect(res.result._rel[relIds]).toEqual(["team3"]);

        v = relationVertexSelector(store.getState());
        expect(v.length).toEqual(1);
        expect(v.map(n => n._id)).toEqual(["team3"]);
    });
});
