<!--Importation des composants -->
<script>
    import Internships from './components/Internships.svelte';
    import AdminDashboard from './components/AdminDashboard.svelte';
    let page = 'home'; // 'home' or 'admin'
</script>

<div class="tab-bar">
    <button on:click={() => page = 'home'} class={page === 'home' ? 'active' : ''}>Home</button>
    <button on:click={() => page = 'admin'} class={page === 'admin' ? 'active' : ''}>Admin</button>
</div>

{#if page === 'home'}
    <Internships />
{:else if page === 'admin'}
    <AdminDashboard />
{/if}

<style>
    .tab-bar {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }
    button {
        padding: 10px 20px;
        margin: 0 10px;
        font-size: 16px;
        background-color: white;
        color: black;
        border: 1px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s, color 0.3s;
    }
    button:hover {
        background-color: #ff3e00;
        color: white;
    }
    .active {
        background-color: #ff3e00;
        color: white;
        border-color: #ff3e00;
    }
</style>
