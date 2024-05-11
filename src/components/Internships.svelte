<script>
  import { internships } from '../stores/internshipStore.js';
</script>

<div class="internships-container">
  {#each $internships as internship}
    <div class="internship">
      <h2>{internship.positionName} - {internship.companyName}</h2>
      <p class="salary">Salaire: {internship.salary}</p>
      <p class="contact">
        Contact: <a href="mailto:{internship.contactEmail}"
          >{internship.contactEmail}</a
        >
      </p>
      <!--website link-->
        <p class="contact">
            Website: <a href="{internship.website}"
            >{internship.website}</a
            >
        </p>
    </div>
  {/each}
</div>

<style>
  .internships-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  .internship {
    border-bottom: 2px solid #ff3e00; /* Rouge */
    padding: 20px;
    margin-bottom: 10px;
    transition: all 0.3s;
  }
  .internship:hover {
    color: white;
  }
  h2 {
    color: #333;
    font-size: 24px;
  }
  .salary,
  .contact {
    color: #666;
    font-size: 16px;
    margin: 5px 0;
  }
  a {
    color: #ff3e00; /* Rouge */
    text-decoration: none;
  }
</style>
