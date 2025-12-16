// viewer.js - loads /data/recipes.json and renders index + recipe pages
(async function(){

  // Helpers
  const $ = sel => document.querySelector(sel);
  const qs = sel => Array.from(document.querySelectorAll(sel));

  // Load the JSON
  async function loadJSON(){
    try {
      const res = await fetch('./Data/recipes.json', {cache: "no-store"});
      if(!res.ok) throw new Error('No recipes.json found');
      return await res.json();
    } catch(err){
      console.warn('Failed to load recipes.json', err);
      return { meta:{generatedAt:null,version:'0'}, recipes: [] };
    }
  }

  const data = await loadJSON();
  const recipes = (data.recipes || []).slice().reverse(); // newest first
  // Update last update
  const lastUpdate = data.meta && data.meta.generatedAt ? new Date(data.meta.generatedAt).toLocaleString() : '—';
  const lastEl = document.getElementById('lastUpdate');
  if(lastEl) lastEl.textContent = lastUpdate;

  // If index page
  if(document.getElementById('cardGrid')){
    const grid = document.getElementById('cardGrid');
    const search = document.getElementById('search');
    const categoryFilter = document.getElementById('categoryFilter');
    const empty = document.getElementById('empty');

    // build category options
    const cats = [''].concat([...new Set(recipes.map(r=>r.category).filter(Boolean))]);
    cats.forEach(c=>{
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c || 'All categories';
      categoryFilter.appendChild(o);
    });

    function matchesQuery(r, q){
      if(!q) return true;
      q = q.toLowerCase();
      if((r.title||'').toLowerCase().includes(q)) return true;
      if((r.description||'').toLowerCase().includes(q)) return true;
      if((r.tags||[]).join(' ').toLowerCase().includes(q)) return true;
      if((r.ingredients||[]).some(i => (i.item||'').toLowerCase().includes(q))) return true;
      return false;
    }

    function render(){
      const q = (search.value || '').trim();
      const cat = categoryFilter.value;
      const out = recipes.filter(r => matchesQuery(r,q) && (cat ? r.category === cat : true));
      grid.innerHTML = '';
      if(!out.length){
        empty.hidden = false;
        return;
      } else empty.hidden = true;

      out.forEach(r=>{
        const card = document.createElement('article');
        card.className = 'card';
        const imgHtml = r.imageData ? `<img class="thumb" src="${r.imageData}" alt="${r.title}">` : `<div class="thumb" aria-hidden="true"></div>`;
        const tags = (r.tags || []).slice(0,4).map(t => `<span class="pill">${t}</span>`).join('');
        card.innerHTML = `
          ${imgHtml}
          <div>
            <h3>${r.title}</h3>
            <div class="meta">${r.category || ''} • ${r.totalTime || ''} • Serves ${r.servings || '-'}</div>
            <div class="pills">${tags}</div>
            <p style="color:var(--muted);margin-top:10px">${r.description || ''}</p>
          </div>
        `;
        card.addEventListener('click', ()=> {
          // prefer slug param
          const url = new URL(window.location.href);
          window.location = `recipe.html?${r.slug ? 'slug='+encodeURIComponent(r.slug) : 'id='+r.id}`;
        });
        grid.appendChild(card);
      });
    }

    search.addEventListener('input', render);
    categoryFilter.addEventListener('change', render);
    render();
    return;
  }

  // If recipe view page
  if(document.getElementById('recipe')){
    const container = document.getElementById('recipe');
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const id = params.get('id') ? Number(params.get('id')) : null;

    const recipe = slug ? recipes.find(r=>r.slug===slug) : recipes.find(r=>r.id===id);
    if(!recipe){
      container.innerHTML = `<div class="recipe-article"><p>Recipe not found.</p></div>`;
      return;
    }

    const ingredientsHtml = (recipe.ingredients || []).map(i => `<li>${i.qty ? `<strong>${i.qty}</strong> ` : ''}${i.item}</li>`).join('');
    const stepsHtml = (recipe.steps || []).map(s => `<li>${s}</li>`).join('');
    const tagsHtml = (recipe.tags || []).map(t => `<span class="pill">${t}</span>`).join(' ');

    container.innerHTML = `
      <div class="recipe-article">
        <div class="recipe-hero">
          <div class="recipe-head">
            <h2>${recipe.title}</h2>
            <div class="recipe-meta">${recipe.category || ''} • ${recipe.totalTime || ''} • Serves ${recipe.servings || '-'}</div>
            <div class="pills">${tagsHtml}</div>
            <p style="margin-top:12px;color:var(--muted)">${recipe.description || ''}</p>
          </div>
          <div>
            ${ recipe.imageData ? `<img alt="${recipe.title}" src="${recipe.imageData}">` : '' }
            <div style="margin-top:12px;color:var(--muted);font-size:13px">
              <div><strong>Prep:</strong> ${recipe.prepTime || '—'}</div>
              <div><strong>Cook:</strong> ${recipe.cookTime || '—'}</div>
              <div><strong>Difficulty:</strong> ${recipe.difficulty || '—'}</div>
            </div>
          </div>
        </div>

        <div class="section-title">Ingredients</div>
        <ul>${ingredientsHtml}</ul>

        <div class="section-title">Method</div>
        <ol>${stepsHtml}</ol>

        ${ recipe.notes ? `<div class="section-title">Notes</div><p style="color:var(--muted)">${recipe.notes}</p>` : '' }
      </div>
    `;
    return;
  }

})();
