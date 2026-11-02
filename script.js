const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

const progressBar = qs('#progressBar');
const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${percent}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
qsa('.reveal').forEach((element) => observer.observe(element));

qsa('.process button').forEach((button) => {
  button.addEventListener('click', () => {
    const currentItem = button.closest('li');
    qsa('.process li').forEach((item) => {
      const itemButton = qs('button', item);
      const detail = qs('.process-detail', item);
      const open = item === currentItem && itemButton.getAttribute('aria-expanded') !== 'true';
      itemButton.setAttribute('aria-expanded', String(open));
      detail.hidden = !open;
    });
  });
});

const fields = {
  service: qs('#service'),
  cost: qs('#cost'),
  material: qs('#material'),
  energy: qs('#energy'),
  water: qs('#water'),
  social: qs('#social')
};

const outputs = {
  service: qs('#serviceOut'),
  cost: qs('#costOut'),
  material: qs('#materialOut'),
  energy: qs('#energyOut'),
  water: qs('#waterOut'),
  social: qs('#socialOut')
};

const clamp = (number, min = 0, max = 100) => Math.min(max, Math.max(min, number));

function updateScenario() {
  const values = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, Number(input.value)]));

  outputs.service.value = `${values.service}%`;
  outputs.cost.value = `${values.cost >= 0 ? '+' : ''}${values.cost}%`;
  outputs.material.value = `${values.material}%`;
  outputs.energy.value = `${values.energy}%`;
  outputs.water.value = `${values.water}%`;
  outputs.social.value = `${values.social}%`;

  const costScore = clamp(90 - (values.cost * 2.2));
  const operational = Math.round((values.service * 0.68) + (costScore * 0.32));
  const normalizedWater = values.water * 2;
  const socio = Math.round(
    values.material * 0.28 +
    values.energy * 0.26 +
    normalizedWater * 0.20 +
    values.social * 0.26
  );
  const floor = Math.min(values.material, values.energy, normalizedWater, values.social);

  let status = 'REDISEÑAR';
  let message = 'El escenario no alcanza la doble viabilidad. Conviene revisar la mezcla de suministro, el volumen o los requisitos del producto.';
  let color = '#d56d4b';

  if (operational >= 75 && socio >= 65 && floor >= 35) {
    status = 'APROBABLE';
    message = 'El escenario supera los mínimos demostrativos. La aprobación final requiere validar datos, límites territoriales y riesgos no cuantificados.';
    color = '#b8d06f';
  } else if (operational >= 75 && socio >= 55 && floor >= 25) {
    status = 'APROBACIÓN CONDICIONADA';
    message = 'El nivel de servicio es viable, pero el escenario necesita fortalecer al menos un indicador socioambiental antes de aprobarse.';
    color = '#d6a841';
  } else if (operational < 75 && socio >= 65 && floor >= 35) {
    status = 'AJUSTE OPERATIVO';
    message = 'La propuesta muestra desempeño socioambiental, pero todavía no cumple el mínimo operativo. Debe rediseñarse sin sacrificar sus avances.';
    color = '#d6a841';
  }

  qs('#operationalScore').textContent = operational;
  qs('#socioScore').textContent = socio;
  qs('#operationalBar').style.width = `${operational}%`;
  qs('#socioBar').style.width = `${socio}%`;
  qs('#resultStatus').textContent = status;
  qs('#resultStatus').style.color = color;
  qs('#resultMessage').textContent = message;
}

Object.values(fields).forEach((input) => input.addEventListener('input', updateScenario));
qs('#scenarioForm').addEventListener('reset', () => setTimeout(updateScenario, 0));
updateScenario();

const scenes = qsa('.scene');
const presentationToggle = qs('#presentationToggle');
const presentationControls = qs('#presentationControls');
const sceneCounter = qs('#sceneCounter');
let currentScene = 0;

function showScene(index) {
  currentScene = Math.max(0, Math.min(scenes.length - 1, index));
  scenes.forEach((scene, sceneIndex) => scene.classList.toggle('active-scene', sceneIndex === currentScene));
  const title = scenes[currentScene].dataset.shortTitle || `Sección ${currentScene + 1}`;
  sceneCounter.textContent = `${currentScene + 1} / ${scenes.length} · ${title}`;
  scenes[currentScene].scrollTop = 0;
}

function enterPresentation() {
  document.body.classList.add('presentation');
  presentationToggle.setAttribute('aria-pressed', 'true');
  presentationControls.hidden = false;
  showScene(0);
  document.documentElement.requestFullscreen?.().catch(() => {});
}

function exitPresentation() {
  document.body.classList.remove('presentation');
  presentationToggle.setAttribute('aria-pressed', 'false');
  presentationControls.hidden = true;
  scenes.forEach((scene) => scene.classList.remove('active-scene'));
  if (document.fullscreenElement) document.exitFullscreen?.();
}

presentationToggle.addEventListener('click', () => {
  if (document.body.classList.contains('presentation')) exitPresentation();
  else enterPresentation();
});
qs('#exitPresentation').addEventListener('click', exitPresentation);
qs('#prevScene').addEventListener('click', () => showScene(currentScene - 1));
qs('#nextScene').addEventListener('click', () => showScene(currentScene + 1));

document.addEventListener('keydown', (event) => {
  if (!document.body.classList.contains('presentation')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault();
    showScene(currentScene + 1);
  }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    showScene(currentScene - 1);
  }
  if (event.key === 'Escape' && !document.fullscreenElement) exitPresentation();
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('presentation')) {
    exitPresentation();
  }
});
