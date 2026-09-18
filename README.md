# Gestor de Inversiones y Patrimonio

Aplicación web de seguimiento mensual de inversiones, control de capital y análisis de rendimiento por plataformas.

## Características
- Registro y liquidación mensual de inversiones por plataforma y categoría.
- Aislamiento automático de meses en curso vs meses consolidados.
- Métricas anuales consolidadas, rentabilidad ponderada y análisis de drawdown.
- Traspaso automatizado de saldos entre meses.
- Compatible con GitHub Pages y WebIntoApp (rutas relativas optimizadas).

## Despliegue en GitHub Pages
La aplicación incluye un flujo automático en `.github/workflows/deploy.yml`.
Para activarlo en GitHub:
1. Ve a **Settings > Pages** en tu repositorio.
2. En **Build and deployment > Source**, selecciona **GitHub Actions**.
3. La aplicación se compilará y desplegará automáticamente.
