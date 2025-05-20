# 🧩 Briefing: Extensión VS Code para lint y fix de YAML

## 🎯 Objetivo

Crear una extensión para VS Code que integre `yamllint` para análisis de lint y `yamlfix` para aplicar correcciones automáticas o bajo demanda en archivos `.yaml`/`.yml`.

## 🧰 Herramientas clave

- [`yamllint`](https://yamllint.readthedocs.io/en/stable/): herramienta de análisis estático para archivos YAML.
- [`yamlfix`](https://github.com/lyz-code/yamlfix): formateador automático para archivos YAML.
- VS Code API (`vscode`): integración con el editor para activar comandos, registrar diagnósticos, y más.
- Opcional: [`execa`](https://github.com/sindresorhus/execa) para ejecución segura de procesos externos.

## ⚙️ Comportamiento esperado

### Configuración
- La extensión detectará automáticamente un archivo `.yamllint` en la raíz del proyecto para usarlo como configuración.
- Alternativamente, se podrá definir una configuración global o por workspace desde los `settings.json` de VS Code.
- También se podrá configurar la ruta a los ejecutables (`yamllint`, `yamlfix`) en caso de instalaciones personalizadas.

### Linting
- Al guardar un archivo YAML, o manualmente mediante un comando, se ejecutará `yamllint`.
- Los errores y advertencias aparecerán en el panel de *Problemas* de VS Code mediante `diagnostics`.

### Fix
- Si el usuario lo desea, se podrá ejecutar `yamlfix`:
  - Automáticamente al guardar (si está habilitado).
  - Mediante un comando manual (`YAML: Fix file`).
- El contenido del editor se actualizará si hay modificaciones tras el fix.
- Notificaciones informarán del resultado del proceso.

## 📁 Estructura propuesta

vsce-yamllint-fix/
├── src/
│ ├── extension.ts # Entrada principal
│ ├── linter.ts # Ejecuta yamllint
│ ├── fixer.ts # Ejecuta yamlfix
│ ├── config.ts # Carga y gestiona la configuración
│
├── package.json # Configuración de la extensión
├── tsconfig.json
└── README.md


## 🧪 Comandos esperados

- `YAML: Lint file`
- `YAML: Fix file`
- `YAML: Fix all files in workspace`

## 🛠️ Inspiración y referencias

Esta extensión puede usar como referencia mi extensión anterior:
➡️ [`vsce-remove-unused-imports`](https://github.com/kcmr/vsce-remove-unused-imports)

Allí usé una aproximación directa basada en manipular el contenido del editor sin parseo avanzado. En este caso no hace falta usar Babel ni AST, ya que la corrección la realiza `yamlfix`.

## 🚧 Consideraciones

- `yamllint` no aplica fixes, solo reporta. Por eso usamos `yamlfix` como fixer externo.
- Se debe verificar si las herramientas están disponibles (en `$PATH`) y mostrar instrucciones si no lo están.
- Es deseable que la extensión sea robusta ante errores del sistema o fallos en el análisis.

---

## ✅ Posibles mejoras futuras

- Soporte para `yamlfixer` como alternativa.
- Aplicar fixes selectivos desde el panel de problemas.
- Soporte multi-root y ejecución masiva en proyectos monorepo.
