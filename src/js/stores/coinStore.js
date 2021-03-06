import { writable, get, derived } from 'svelte/store';

export const createCoinStore = () => {
    let initialized = false;

    const getStore = () => {
        //Set the Coinstore to the value of the chome.storage.local
        chrome.storage.local.get({"coins": []}, function(getValue) {
            initialized = true;
            CoinStore.set(getValue.coins)
        });
    }

    //Create Intial Store
    const CoinStore = writable([]);

    chrome.storage.onChanged.addListener(function(changes) {
        for (let key in changes) {
            if (key === 'coins') {
                if (JSON.stringify(changes[key].newValue) !== JSON.stringify(get(CoinStore))) {
                    CoinStore.set(changes[key].newValue)
                }
            }
        }
    });

    //Set the Coinstore to the value of the chome.storage.local
    getStore()

    let subscribe = CoinStore.subscribe;
    let update = CoinStore.update;
    let set = CoinStore.set;

    return {
        subscribe,
        set,
        update,
    };
}
//Create CoinStore instance
export const CoinStore = createCoinStore();

//Create a derived store to total all wallets
export const coinsDropDown = derived(CoinStore, ($CoinStore) => {
    let returnList = [{
        value: undefined,
        name: `Select Wallet`,
        selected: true
    }]
    $CoinStore.map(c => {
        returnList.push({
            value: c,
            name: `${c.nickname} ${c.vk}`,
            selected: false
        })
    })
    return returnList
});