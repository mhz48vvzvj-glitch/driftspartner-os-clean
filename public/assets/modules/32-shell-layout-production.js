/* Driftspartner OS module: 32-shell-layout-production.js
   Production sidebar/topbar layout without dashboard presentation data. */
function renderRoleMenu(){
  const allowed=roleMenus[user().role]||roleMenus.superadmin;
  const groups=[
    ['EIENDOM',['home','property']],
    ['DRIFT',['operations']],
    ['OKONOMI',['finance']],
    ['STYRE',['board']],
    ['AI & DATA',['ai','cloud']],
    ['MARKED',['market']],
    ['PORTALER',['portal']],
    ['CONTROL CENTER',['admin']]
  ];
  document.getElementById('sideNav').innerHTML=groups.map(group=>{
    const items=group[1].filter(id=>allowed.includes(id));
    if(!items.length)return '';
    return `<label>${group[0]}</label>${items.map(id=>`<button class="${id===current?'active':''}" onclick="openMain('${id}',this)"><span class="nav-ico">${Icon(menuIcons[id])}</span>${id==='home'?'Dashboard':menuLabels[id]}</button>`).join('')}`;
  }).join('');
}
function renderPropertyContext(){
  const p=property(),u=user(),initials=(u.name||'U').split(' ').map(x=>x[0]).join('').slice(0,2);
  document.getElementById('propertyContext').innerHTML=`<div class="ops-property-picker"><select id="propertySelect" onchange="switchProperty(this.value)">${allowedProperties().map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="top-search"><input placeholder="Sok i eiendom, saker, dokumenter..." onkeydown="if(event.key==='Enter')act('Sok kjort i '+property().name)"></div><button class="action notify" onclick="openTabSafe('Varsler')">${Icon('bell')} Varsler</button><button class="action" onclick="showDrawer('Hjelp','<div class=output>Velg eiendom, bruk hurtighandlinger eller sporr AI Director nederst.</div>')">Hjelp</button><div class="profile"><div class="avatar">${esc(initials)}</div><div><strong>${esc(u.name)}</strong><small>${esc(u.role)}</small></div></div>`;
}
