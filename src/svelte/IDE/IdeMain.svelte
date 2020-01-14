<script>
	import { onMount, getContext, setContext } from 'svelte'
	
    //Stores
    import { breadcrumbs, currentNetwork, activeTab, FilesStore } from '../../js/stores/stores.js';

	//Components
	import { IdeErrorsBox, IdeMethods, IdeTabs, Components }  from '../../js/router.js';
	const { Button } = Components;

    //Context
	const { openModal } = getContext('app_functions');
	setContext('editor_functions', {
		checkContractExists: (contractName, options) => checkContractExists(contractName, options),
		addContractTab: (contractName, contractCode) => getMethods(contractName, contractCode)
    });

	let lintErrors = undefined;
	let editorIsLoaded = false;

	import Monaco from './IdeMonacoEditor.svelte';
  
	let monaco;
	
	onMount(() =>{
		breadcrumbs.set([{name: 'Smart Contracts', page: {name: ''}}]);

		return () => {
			editorIsLoaded = false;
		}
	})

	function editorLoaded(){
		editorIsLoaded = true;
		if ($activeTab.type === 'local') lint();
	}

	function lint(callback){
		let data = {
			name: $activeTab.name,
			code: $activeTab.code
		}
		fetch(`http://${$currentNetwork.ip}:${$currentNetwork.port}/lint`, {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json'
			},
            body: JSON.stringify(data)
        })
		.then(res => res.json())
		.then(res => {
			lintErrors = res;
			if (!callback) return;
			callback(res);
		})
		.catch(err => console.log(err))
	}

	function submit(){
		openModal('IdeModelSubmit', {
			'contractName': 'submission', 
            'methodName': 'submit_contract', 
            args: {
				name: {
					type: 'text',
					value: $activeTab.name
				},
				code:{
					type: 'text',
					value: $activeTab.code
				}
			}
		})
	}

	function reformatMethodObject(methods){
        methods.map(method => {
            if (!method.args) method.args = {};
            method.arguments.map((arg, index) => {
               if (!method.args[arg]) method.args[arg] = {type: "text", value: 'testing'}
            })
        })
        return [...methods]
	}

	function handleMethodClick(e){
		openModal('IdeModelMethodTx', e.detail)
	}

	function checkContractExists(contractName, options){
		fetch(`http://${$currentNetwork.ip}:${$currentNetwork.port}/contracts/${contractName}`)
			.then(res => res.json())
			.then(res => {
				try{
					options.callback(res, !options.data ? undefined : options.data);
				} catch (e) {
					return false;
				}
			})
			.catch(err => console.log(err))
	}
	
    function getMethods(contractName, contractCode){
        fetch(`http://${$currentNetwork.ip}:${$currentNetwork.port}/contracts/${contractName}/methods`)
            .then(res => res.json())
            .then(res => {
                FilesStore.addExistingContract(contractName, contractCode, res.methods, currentNetwork.name);
            })
            .catch(err => console.log(err))
    }
</script>

<style>
.buttons{
    background: var(--bg-color-grey);
    padding: 10px 17px;
}

</style>

<div id="monaco_window" class="flex-column">
	{#if editorIsLoaded}
		<IdeTabs {checkContractExists}/>
	{/if}

	<div class="editor-row">
		<Monaco 
			bind:this={monaco} 
			on:loaded={editorLoaded}
			{checkContractExists}
			on:clickMethod={handleMethodClick}
			{lintErrors}
		/>
		{#if editorIsLoaded && $activeTab.type === 'local'}
			<div class="buttons flex-row">
				{#if $activeTab.type === 'local'}
					<Button 
						id={'contractTab-btn'} 
						classes={'button__transparent'}
						name="Check Contract"
						margin={'0 10px 3px 0'}
						height={'42px'}
						click={() => lint()}
					/>
					<Button 
						id={'contractTab-btn'} 
						classes={'button__transparent button__blue'}
						name="Submit to Network"
						height={'42px'}
						click={() => lint(submit)}
					/>
				{/if}
			</div>
		{/if}
	</div>
	{#if editorIsLoaded && $activeTab.type === 'local'}
		<IdeErrorsBox {lintErrors} />
	{/if}
	{#if editorIsLoaded && $activeTab.methods}
		<IdeMethods methods={reformatMethodObject($activeTab.methods)} />
	{/if}
</div>