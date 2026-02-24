# Skill: Remote Sensing Analysis

## Objetivo
Este skill equipa qualquer agente com conhecimento técnico-científico especializado em sensoriamento remoto, incluindo:
- Análise de produtos LULC (MapBiomas, CGLS, ESRI, GLAD, ESA WorldCover)
- Processamento de dados raster e séries temporais
- Estatísticas espaciais e métricas de acordância inter-produto
- Pesquisa em literatura científica indexada

---

## 1. Fundamentos de Produtos LULC

### 1.1 Hierarquia de Classes Comuns

| Classe | MapBiomas | CGLS | ESRI | GLAD |
|--------|-----------|------|------|------|
| Floresta | 1 | 111,112,113 | 2 | 1 |
| Savana / Cerrado | 3 | 121,122 | — | 3 |
| Agricultura | 18,39,20,21 | 40 | 5 | 6 |
| Pastagem | 15 | 30 | 7 | 4 |
| Área Urbana | 24,25 | 50 | 7 | 7 |
| Água | 33 | 80 | 1 | 8 |
| Área Não Vegetada | 22,23 | 200 | 8 | — |

### 1.2 Resolução e Cobertura Temporal

| Produto | Resolução Espacial | Resolução Temporal | Cobertura |
|---------|-------------------|-------------------|-----------|
| MapBiomas | 30m (Landsat) | Anual (1985–atual) | Brasil + América do Sul |
| CGLS-LC100 | 100m | Anual (2015–2019) | Global |
| ESRI Land Cover | 10m (Sentinel-2) | Anual (2017–atual) | Global |
| GLAD ARD | 30m (Landsat) | Anual (2000–atual) | Global |
| ESA WorldCover | 10m (Sentinel-1+2) | 2020, 2021 | Global |

---

## 2. Métricas de Acordância Inter-Produto

### 2.1 Métricas Pixel-a-Pixel

```python
import numpy as np
from sklearn.metrics import cohen_kappa_score, confusion_matrix

def overall_accuracy(y_true, y_pred):
    """Proporção de pixels concordantes."""
    return np.mean(y_true == y_pred)

def cohens_kappa(y_true, y_pred):
    """Kappa corrigido por chance — Cohen (1960)."""
    return cohen_kappa_score(y_true, y_pred)

def per_class_agreement(y_true, y_pred, classes):
    """F1-score por classe para análise de concordância."""
    from sklearn.metrics import f1_score
    return f1_score(y_true, y_pred, labels=classes, average=None)

def dice_coefficient(mask_a, mask_b):
    """Dice/Sørensen coefficient para classes binárias."""
    intersection = np.logical_and(mask_a, mask_b).sum()
    return 2 * intersection / (mask_a.sum() + mask_b.sum() + 1e-8)
```

### 2.2 Métricas de Frequência Temporal

```python
def temporal_frequency(stack: np.ndarray, class_value: int, axis: int = 0) -> np.ndarray:
    """
    Calcula a frequência relativa de uma classe numa série temporal.
    
    Args:
        stack: array (T, H, W) com classificações por ano
        class_value: valor da classe alvo
        axis: eixo temporal (padrão=0)
    
    Returns:
        array (H, W) com frequência [0.0, 1.0]
    
    Reference: Defries et al. (2004); Hansen et al. (2013) - Science
    """
    valid_mask = stack != NODATA_VALUE
    class_mask = stack == class_value
    freq = np.where(
        valid_mask.sum(axis=axis) > 0,
        class_mask.sum(axis=axis) / valid_mask.sum(axis=axis),
        np.nan
    )
    return freq

def temporal_stability_index(stack: np.ndarray, axis: int = 0) -> np.ndarray:
    """
    Índice de estabilidade temporal (dominância da classe mais frequente).
    
    Reference: Pérez-Hoyos et al. (2017) Remote Sensing 9(1):2
    """
    from scipy.stats import mode
    dominant_class, dominant_count = mode(stack, axis=axis)
    valid_count = (stack != NODATA_VALUE).sum(axis=axis)
    return np.where(valid_count > 0, dominant_count / valid_count, np.nan)
```

### 2.3 Ensemble de Produtos

```python
def majority_vote_ensemble(products: list[np.ndarray], nodata: int = 0) -> np.ndarray:
    """
    Votação majoritária simples entre múltiplos produtos.
    
    Reference: Herold et al. (2011) Remote Sensing of Environment 115(6):1559
    """
    stack = np.stack(products, axis=0)
    from scipy.stats import mode
    result, _ = mode(stack, axis=0)
    return result.squeeze()

def weighted_ensemble(products: list[np.ndarray], 
                      weights: list[float],
                      nodata: int = 0) -> np.ndarray:
    """
    Ensemble ponderado por confiança do produto.
    
    Reference: Fritz et al. (2011) Remote Sensing of Environment 115(5):1316
    """
    # Para dados categóricos → one-hot encoding + weighted sum
    raise NotImplementedError("Ver implementação em SCRIPT/processing/")
```

---

## 3. Processamento Raster (Boas Práticas)

### 3.1 Leitura Robusta com rasterio

```python
import rasterio
import numpy as np
from pathlib import Path

def read_raster_safe(path: Path, 
                     band: int = 1,
                     fill_nodata: bool = True) -> tuple[np.ndarray, dict]:
    """
    Leitura segura de raster com tratamento de nodata.
    
    Best practice: sempre ler nodata do perfil, nunca hardcoded.
    Reference: rasterio docs — https://rasterio.readthedocs.io/
    """
    with rasterio.open(path) as src:
        data = src.read(band)
        profile = src.profile.copy()
        nodata = src.nodata
        
        if fill_nodata and nodata is not None:
            data = np.where(data == nodata, np.nan, data.astype(float))
    
    return data, profile

def reproject_match(src_path: Path, 
                    ref_path: Path, 
                    resampling_method: str = 'nearest') -> np.ndarray:
    """
    Reprojetar e alinhar raster a um raster de referência.
    
    IMPORTANTE: para classificações LULC, usar 'nearest' (não 'bilinear').
    Reference: Foody (2002) Remote Sensing of Environment 80(1):185
    """
    from rasterio.warp import reproject, Resampling
    from rasterio.enums import Resampling as RS
    
    method_map = {
        'nearest': RS.nearest,
        'bilinear': RS.bilinear,
        'cubic': RS.cubic,
        'average': RS.average,
    }
    # ... implementação
```

### 3.2 Gestão de CRS e Reprojeção

```python
# ⚠️ SEMPRE verificar CRS antes de operações espaciais
# Para dados globais: WGS84 (EPSG:4326) ou Eckert IV (ESRI:54012)
# Para dados regionais Brasil: SIRGAS 2000 (EPSG:4674) ou UTM zones

CRS_RECOMMENDATIONS = {
    'global_analysis': 'ESRI:54012',    # Eckert IV (área igual)
    'south_america': 'EPSG:4087',       # World Equidistant Cylindrical
    'brazil_national': 'EPSG:4674',     # SIRGAS 2000
    'landsat_default': 'EPSG:4326',     # WGS84 geographic
    'sentinel_default': 'EPSG:32621',   # UTM zone example
}
```

---

## 4. Referências Bibliográficas Fundamentais

### 4.1 Acordância e Validação LULC

```bibtex
@article{Foody2002,
  title={Status of land cover classification accuracy assessment},
  author={Foody, Giles M},
  journal={Remote Sensing of Environment},
  volume={80}, number={1}, pages={185--201}, year={2002},
  doi={10.1016/S0034-4257(01)00295-4}
}

@article{Herold2011,
  title={Some challenges in global land cover mapping: An assessment of agreement
         and accuracy in existing 1 km datasets},
  author={Herold, M and others},
  journal={Remote Sensing of Environment},
  volume={112}, pages={2538--2556}, year={2008},
  doi={10.1016/j.rse.2007.11.013}
}

@article{Fritz2011,
  title={Highlighting continued uncertainty in global land cover maps for the user community},
  author={Fritz, S and others},
  journal={Environmental Research Letters},
  volume={6}, number={4}, pages={044005}, year={2011},
  doi={10.1088/1748-9326/6/4/044005}
}
```

### 4.2 Produtos LULC Globais

```bibtex
@article{Souza2020,
  title={Reconstructing Three Decades of Land Use and Land Cover Changes in Brazilian Biomes 
         with Landsat Archive and the MapBiomas Platform},
  author={Souza, C and others},
  journal={Remote Sensing},
  volume={12}, number={17}, pages={2735}, year={2020},
  doi={10.3390/rs12172735}
}

@article{Buchhorn2020,
  title={Copernicus Global Land Cover Layers—Collection 2},
  author={Buchhorn, M and others},
  journal={Remote Sensing},
  volume={12}, number={6}, pages={1044}, year={2020},
  doi={10.3390/rs12061044}
}

@article{Zanaga2022,
  title={ESA WorldCover 10 m 2021 v200},
  author={Zanaga, D and others},
  year={2022},
  doi={10.5281/zenodo.7254221}
}

@article{Potapov2022,
  title={Global maps of cropland extent and change show accelerated cropland expansion 
         in the twenty-first century},
  author={Potapov, P and others},
  journal={Nature Food},
  volume={3}, pages={19--28}, year={2022},
  doi={10.1038/s43016-021-00429-z}
}
```

### 4.3 Séries Temporais e Detecção de Mudanças

```bibtex
@article{Verbesselt2010,
  title={Detecting trend and seasonal changes in satellite image time series},
  author={Verbesselt, J and others},
  journal={Remote Sensing of Environment},
  volume={114}, number={1}, pages={106--115}, year={2010},
  doi={10.1016/j.rse.2009.08.014}
}

@article{Zhu2014,
  title={Continuous change detection and classification of land cover using all 
         available Landsat data},
  author={Zhu, Z and Woodcock, CE},
  journal={Remote Sensing of Environment},
  volume={144}, pages={152--171}, year={2014},
  doi={10.1016/j.rse.2014.01.011}
}
```

---

## 5. Checklist de Qualidade para Análises SR

### 5.1 Pré-processamento
- [ ] CRS verificado e consistente entre produtos
- [ ] Resolução espacial alinhada (reprojeção com método adequado)
- [ ] Nodata tratado explicitamente (não assumir 0 = nodata)
- [ ] Extensão geográfica igual para todos os produtos
- [ ] Período temporal alinhado (mesmo ano/estação)

### 5.2 Análise de Acordância
- [ ] Dicionário de reclassificação documentado e versionado
- [ ] Verificar classes de menor concordância separadamente
- [ ] Reportar N amostral (pixels válidos) além das métricas
- [ ] Avaliar viés espacial (bordas, áreas heterogêneas)
- [ ] Comparar com estudo de referência da área

### 5.3 Validação
- [ ] Amostras de validação independentes dos dados de treino
- [ ] Validação cruzada espacial (não aleatória)
- [ ] Intervalo de confiança para todas as métricas reportadas
- [ ] Análise de sensibilidade ao método de reamostragem

---

## 6. Fontes de Dados para Pesquisa

```yaml
# Acesso programático para literatura
semantic_scholar_api: "https://api.semanticscholar.org/graph/v1/paper/search?query={TERM}&fields=title,authors,year,abstract,citationCount"
crossref_api: "https://api.crossref.org/works?query={TERM}&filter=type:journal-article,from-pub-date:2018"
unpaywall_api: "https://api.unpaywall.org/v2/{DOI}?email=your@email.com"

# Portais de artigos (open access)
mdpi_remote_sensing: "https://www.mdpi.com/search?q={TERM}&journal=remotesensing"
essoar_preprints: "https://www.essoar.org/search#query={TERM}"
eartharxiv: "https://eartharxiv.org/search/?q={TERM}"

# Documentação de produtos
mapbiomas_github: "https://github.com/mapbiomas"
copernicus_land: "https://land.copernicus.eu/global"
glad_umd: "https://glad.umd.edu/dataset"
```
