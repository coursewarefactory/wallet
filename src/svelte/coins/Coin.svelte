<script>
    import { onMount } from 'svelte';
    import { totalUsdBal, SettingsStore } from '../../js/stores.js';
    
    // Props
        export let coin;
    //

    onMount(() => {
        createTotals();
    });

    let totalBalance = 0; 
    let totalUsdBalance = 0; 

    function createTotals(){
        for (let pubkey in coin.pubkeys){
            totalBalance += coin.pubkeys[pubkey].balance
            totalUsdBalance += coin.pubkeys[pubkey].USD_value
        }
    }
    
	function switchPage(page, data) {
		data = data || {}
		let newStore = $SettingsStore;
		newStore.currentPage.name = page;
        newStore.currentPage.data = data;
		SettingsStore.set(newStore);
	}

</script>

<style>
    .container{
        display: grid;
        grid-auto-flow: column;
        
    }

</style>

<div class="container">
    <h2 on:click={ () => switchPage('CoinDetails', coin)} style="cursor: pointer;">{coin.name}</h2>
    <ul>
        <li># of addresses {Object.keys(coin.pubkeys).length}</li>
        <li>balance {totalBalance} {coin.symbol}</li>
        <li>( ${totalUsdBalance.toFixed(2)} )</li>
    </ul>
</div>