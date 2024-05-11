<script>
    import { internships } from '../stores/internshipStore.js';
    let positionName, companyName, salary, contactEmail, website;

    function addInternship() {
        internships.update((current) => [
            ...current,
            { positionName, companyName, salary, contactEmail, website},
        ]);
        positionName = companyName = salary = contactEmail = website = ''; // Reset fields
    }
</script>

<form on:submit|preventDefault={addInternship}>
    <input
        placeholder="Position Name"
        bind:value={positionName}
        required
    />
    <input
        placeholder="Company Name"
        bind:value={companyName}
        required
    />
    <input
        placeholder="Salary"
        bind:value={salary}
        required
    />
    <input
        placeholder="Contact Email"
        type="email"
        bind:value={contactEmail}
        required
    />
    <!--website link-->
    <input
        placeholder="Website"
        type="url"
        bind:value={website}
        required
    />
    <button type="submit">Ajouter le stage</button>
</form>

<style>
    form {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }
    input, button {
        padding: 10px;
        font-size: 16px;
        border-radius: 4px;
        border: 1px solid #ccc;
    }
    input:focus, button:focus {
        border-color: #ff3e00;
        outline: none;
    }
    button {
        background-color: #ff3e00;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    button:hover {
        background-color: #e63900;
    }
</style>
