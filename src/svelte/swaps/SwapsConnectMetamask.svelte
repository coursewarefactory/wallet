<script>
    import { getContext, onMount, onDestroy, afterUpdate } from 'svelte';
    
    //Stores
    import { steps, currentNetwork } from '../../js/stores/stores.js';

	//Components
	import { Components }  from '../Router.svelte'
    const { Button } = Components;

    //Images
    import MetaMask from '../../img/misc/metamask-fox.svg'
    import checkmarkWhite from '../../img/menu_icons/icon_checkmark-white.svg'

    //Context
    const { changeStep, setSwapInfo } = getContext('functions');
    const { switchPage } = getContext('app_functions');

    const ethNetworkTypes = {
        'dTAU' : ['Kovan Network'],
        'TAU' : ['Main Network']
    }
    const maxChecks = 30;
    $: metamaskInfo = null;
    $: installStatus = !metamaskInfo ? 'Not Installed' : 'Installed'
    $: isCorrectNetwork = !metamaskInfo ? false : metamaskInfo.chainInfo.tauSymbol === $currentNetwork.currencySymbol
    $: errorMsg = '';
    $: metaMaskButton = !metamaskInfo ? "Connect MetaMask" : isCorrectNetwork ? 'Connected' : 'Connect Again'
    $: address = !metamaskInfo ? '' : metamaskInfo.error ? '' : metamaskInfo.address
    $: blockExplorerURL = !metamaskInfo ? '' : metamaskInfo.error ? '' : metamaskInfo.chainInfo.blockExplorer
    $: checking = false;
    $: currChecks = 0;
    
    onMount(() => {
        steps.update(stepsStore => {
            stepsStore.currentStep = 2;
            return stepsStore
        })
    })

    onDestroy(() =>{
        chrome.runtime.onMessage.removeListener(metamaskConnected)
    })

    const nextPage = () => {
        setSwapInfo(metamaskInfo)
        changeStep(2)
    }

    const connectMetaMask = () => {
        chrome.runtime.sendMessage({type: 'connectToMetamask', data: {}}, () => {
            errorMsg = ''
            checking = true
            checkForResponses.clear();
            checkForResponses.start();
        })
    }

    const metamaskConnected = (message, sender, sendResponse) => {
		if (message.type === 'metamaskConnected') {
            let address = message.data.address
            if (typeof address.error === 'undefined'){
                metamaskInfo = message.data
                errorMsg = ''
            } else {
                errorMsg = address.error
            }
            checking = false
        }
    }

    chrome.runtime.onMessage.addListener(metamaskConnected)

    const responseChecker = () => {
        let timerId
        const clear = () => {
                currChecks = 0;
                clearTimeout(timerId);
        }
        const checkIfDone = () => {
            currChecks = currChecks + 1
            if (checking){
                if (currChecks >= maxChecks) {
                    errorMsg = 'Timed out looking for Metamask plugin. If you have confirmed Metamask is installed and setup then it may be attempting to contact you via a popup window.  Please verify and try again.'
                }
                else {
                    timerId = setTimeout(checkIfDone, 1000);;
                }
            }
            else {
                clear()
            }
        }

        return {
            start: () => {
                timerId = setTimeout(checkIfDone, 0);
            },
            clear
        }
    }
    let checkForResponses = responseChecker()

</script>

<style>
.text-box2{
    color: cyan;
    margin-bottom: 60px;
}
a{
    text-decoration: unset;
}
.metamask-logo{
    width: 10vw;
}
p{
    width: max-content;
    margin: 1rem 0 0;
}
p.address{
    margin: 0 0 0.5rem;
}
p.green {
    color: green;
}
p.error-box{
    max-width: 300px;
    text-align: center;
}

</style>

<div class="flex-row swaps-intro">
    <div class="flex-column content-left">
        <h6>Connect To Metamask</h6>
    
        <div class="text-box text-body1 text-primary">
            {'The Ethereum portion of the swap will use MetaMask'}
        </div>

        <div class="text-box2 text-body1">
            <span>{`To install metamask follow the instructions on `}
                <a href="https://metamask.io/" class="outside-link" target="_blank" rel="noreferrer noopener">metamask.io</a>
            </span>
        </div>

        <div class="flex-column buttons">
            {#if installStatus === "Installed" && isCorrectNetwork}
                <Button id={'continue-btn'}
                    classes={'button__solid button__purple'}
                    styles={'margin-bottom: 16px;'}
                    width={'100%'}
                    name="Continue" 
                    click={nextPage} />
            {:else}
                <Button id={'check-btn'}
                        classes={`button__solid button__purple`}
                        styles={'margin-bottom: 16px;'}
                        width={'100%'}
                        name={metaMaskButton}
                        click={connectMetaMask}
                        disabled={checking && errorMsg === ''}/>
            {/if}
            <Button id={'back-btn'}
                    classes={'button__solid'} 
                    styles={'margin-bottom: 16px;'}
                    width={'100%'}
                    name="Cancel" 
                    click={() => switchPage('Swaps')} />  

            <a  class="text-caption text-secondary" 
                href="https://www.lamden.io" 
                target="_blank" 
                rel="noopener noreferrer" >
                Help & FAQ
            </a>
        </div>


    </div>
    <div class="flex-column content-right">
        <div class="metamask-logo">
            {@html MetaMask}
        </div>
        <a href="https://metamask.io/" class="outside-link" target="_blank" rel="noreferrer noopener">metamask.io</a>
        <p  class="text-body1"
            class:text-green={installStatus === 'Installed'}>
            {installStatus === 'Installed' ? `MetaMask is Installed`: checking && errorMsg === '' ?  `checking ${currChecks} / ${maxChecks}` : ''} 
        </p>
        {#if address !== ''}
            <span class="text-body2">{`ETH Address `}
            <a  href={`${blockExplorerURL}/address/${address}`} 
                class="text-body2 outside-link " target="_blank" rel="noopener noreferrer">{` ${address}`}
            </a></span>
        {/if}
        {#if installStatus === 'Installed' && errorMsg === ''}
            {#if isCorrectNetwork}
                <p>{`Connected to Ethereum ${ethNetworkTypes[$currentNetwork.currencySymbol]}`}</p>
            {:else}
                <p class="text-red error-box">{`Please switch MetaMask to ${ethNetworkTypes[$currentNetwork.currencySymbol]} and connect again.`}</p>
            {/if}
        {/if}
        {#if errorMsg !== ''}
            <p class="text-red error-box">{errorMsg}</p>
        {/if}
    </div>
</div>






