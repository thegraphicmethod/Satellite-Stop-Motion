Satellite Stop Motion es una pequeña aplicación que permite hacer capturas de pantalla de un mapa de satélite de forma automática.
Está pensada para hacer un "stop motion" lineal viajando camino determinado por una lista de puntos (longitud, latitud). El resultado de ejecutar la aplicación es una serie de capturas de pantalla que servirán de fotogramas del video.

El resultado es algo del estilo a lo que puede verse en la cabecera. 


## inicio rápido
- Instalar nodejs en tu ordenador si aun no lo tienes: https://nodejs.org/es/
- Descargar el proyecto desde github o clonarlo con:
``` 
git clone https://github.com/thegraphicmethod/Satellite-Stop-Motion.git
```
- Instalar dependencias: 
```
npm install
```
- Preparar el archivo de puntos con tu ruta (o utilizar alguno de los que hay en la carpeta paths como ejemplo)
- Rellenar el archivo de configuración en config/default.json
  - Lo mínimo es poner el token de mapbox. 
- Ejecutar el programa: 
``` 
node main.js 
```


## Inicio lento

### configuración
Para usar la aplicación hay que rellenar los parámetros del archivo de configuración en default.json
``````
{
    "dataset": {
        "path": "/Users/user1/proyectos/dataset_puntos.json",
        "accesor": "features[0].geometry.coordinates"
    },
    "map":{
        "zoom": 10,
        "step": 0.0015, 
        "mapbox":{       
            "mapboxToken": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "mapboxStyle": "mapbox://styles/mapbox/satellite-v9"
        }
    },
    "image": {
        "jpgQuality": 90,
        "width": 1280,
        "height":720,
        "name": "guadalquivir"
    },
    "headless": false,
    "debug": true,
    "runloop":false

}
``````

La mayoría de los parámetros se explican por si solos.
- **dataset.path**: es la ruta al archivo de coordenadas por defecto están en la carpeta paths
- **dataset.accesor**: es el acceso al array de coordenadas dentro del archivo de coordenadas. Si el archivo de coordenadas es un array simple, se deja en blanco.
- **map.zoom**: es el zoom del mapa
- **map.step**: es el tamaño del salto en grados de longitud y latitud entre cada captura de pantalla.
- **map.mapbox.mapboxToken**: es el token de mapbox
- **map.mapbox.mapboxStyle**: es el estilo de mapbox. Puedes elegir entre los que hay aquí: https://docs.mapbox.com/api/maps/#styles
- **image.jpgQuality**: es la calidad de la imagen jpg entre 0-100
- **image.width**: es el ancho de la imagen
- **image.height**: es el alto de la imagen
- **image.name**: es el nombre de la imagen. Se le añadirá un número de secuencia al final.
- **headless**: si es true, no se mostrará la ventana del navegador. Si es false, no se mostrará. 
- **debug**: si es true, se mostrará la ventana de navegador con el archivo de ruta, los puntos de salto, una escala etc... para comprobar que todo está bien y elegir el nivel de zoom y el tamaño del salto.
- **runloop**: si es true, el programa comenzará a hacer capturas de pantalla automáticamente. Si es false, solo se muestra la ruta. ( util para debug)


Ahora podemos ver en detalle algunos parámetros:

### Cuenta de mapbox
Las imágenes de satelite están sacadas de Mapbox Para usar mapbox es necesario tener una cuenta y un token de acceso. Lee por aquí para conseguir uno:
https://docs.mapbox.com/help/getting-started/access-tokens/

> NOTA: Por defecto no se muestra el logo de mapbox en las capturas de pantalla. Esta herramienta está pensada para generar frames de video, es TU RESPONSABILIDAD respetar las [condiciones de uso de mapbox](https://docs.mapbox.com/help/getting-started/attribution/#) y mostrar el logo de mapbox en tus videos, arriba abajo, en un lateral, en el pie de página, etc... No te dicen dónde, sólo que lo hagas.

> NOTA 2: Si no quieres usar mapbox, puedes usar otro proveedor de mapas. Pero tendrás que modificar el código para que funcione con otro proveedor. (ver sección de configuración avanzada)


> NOTA 3: MAPBOX es un servicio de pago. Tiene un plan de uso gratuito muy generoso, pero si te pasas tendrás que pagar. Tenlo en cuenta.


### Archivo de coordenadas

Preparar el archivo de coordenadas **es lo más complejo e importante de todo el proceso.** Puedes ayudarte de herramientas como https://geojson.io o https://mapshaper.org

Usando geojson.io puedes crear una línea haciendo click en distintos puntos y exportarla en formato geojson.

<video width="968" height="320" autoplay loop muted>
  <source src="/geojsonio.mp4" type="video/mp4">
</video>

El archivo de coordenadas es un archivo de texto JSON con una lista de puntos. Cada punto es una línea con dos números separados por una coma. El primer número es la longitud y el segundo la latitud.
Puede tener forma de un array simple o de un objeto tipo geojson LineString como el que se genera con geojson.io

**Pero lo importantes que la lista de coordenadas sea un sólo array de puntos:**

`````
[
  [ -3.70325, 40.4167 ],
  [ -3.70325, 40.4167 ],
  ...
]
`````

Si es un objeto geojson del tipo LineString:

```json
{
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [ -3.70325, 40.4167 ],
      [ -3.70325, 40.4167 ],
      ...
    ]
  }
}
```
Hay que indicar en el archivo de configuración como se accede al array de coordenadas en el parámetro "accesor". En el ejemplo de arriba sería:
```json
"accesor": "features[0].geometry.coordinates"
```

Si el archivo de coordenadas es un array simple, el accesor **se deja en blanco**

Puedes guardar este archivo en la carpeta por defecto paths.

#### steps
El parámetro "step" indica el tamaño del salto en grados de longitud y latitud entre cada captura de pantalla. A cuantos kilometros se corresponde depende de la posición en la que estemos. 
Si no necesitas precisión puedes dejarlo en 0.0015. Si necesitas más precisión puedes calcular el tamaño del salto en grados de longitud y latitud con esta herramienta: https://www.movable-type.co.uk/scripts/latlong.html
El modo debug te ayudará a ver si el tamaño del salto es el correcto.

#### nombre del archivo
Este es un ejemplo de nombre de archivo:
`````
Parte4_poi_0087-0013--16_810771274131348-21_37934406726761
// es decir:
name_poi_XXXX-YYYY-LON-LAT
`````
El nombre del archivo se compone de varias partes:
- Parte4: es el parámetro "image.name" del archivo de configuración
- XXXX: es el numero de punto en el que estamos según el archivo de coordenadas
- YYYY: es el número punto interpolado entre el punto XX y el punto XX+1. Por ejemplo si tenemos una distancia de 1000 metros entre el punto XX y el punto XX+1 y el tamaño del salto es de 100 metros, YY irá de 0 a 9.
- LON: es la longitud del punto de la captura de pantalla
- LAT: es la latitud del punto de la captura de pantalla

A la hora de convertirlo en video sólo habría que ordenador los archivos por nombre y convertirlos en video con ffmpeg.

### Modo debug
Si pones el parámetro debug a true en el archivo de configuración, se mostrará la ventana del navegador con el mapa y la ruta.

![debug](/debug.jpg "captura modo debug")


## Uso avanzado
Si sabes programar puedes modificar el código para adaptarlo a tus necesidades.
El proyecto está compuesto de una web con  un mapa a pantalla completa. Cada frame es una captura de pantalla de ese mapa.
El programa se encarga de mover el mapa y hacer capturas de pantalla. Esto se hace con la librería [puppeteer](http://pptr.dev/)


### Parte 1. Frontend

Lo que está en la carpeta frontend es basicamente un mapa a pantalla completa.
Es un proyecto vue que se distribuye ya generado en la carpeta /dist y con el codigo fuente disponible. 
En el archivo frontend/app.vue. 

Si quieres modificarlo tendrás que instalar las dependencias y ejecutarlo con `npm run build`

### Backend (Puppeteer)
Es un script en nodejs que controla el frontend y hace las capturas de pantalla.
Su principal tarea es interpolar entre los puntos de la ruta y hacer capturas de pantalla de cada punto.

Al final se obtienen una serie de capturas de pantalla que se pueden convertir en un video con ffmpeg, por ejemplo con este comando:
``````
ffmpeg -framerate 30 -i sahara_%04d.jpg -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p sahara.mp4
``````


## Como crear videos con las imágenes
Esto ya no es parte de la aplicación. Pero puede ser útil para crear el video de las imágenes de forma automática con ffmpeg (https://ffmpeg.org/).
Aquí dejo algunos ejemplos de comandos ffmpeg para convertir las imágenes en video:

#### usando una lista de imagenes
```shell
ffmpeg -f concat -i list.txt -c:v libx264 -pix_fmt yuv420p output.mp4
```
donde list.txt es un archivo de texto con la lista de imagenes:

`````
file 'sahara_0000.jpg'
file 'sahara_0001.jpg'
file 'sahara_0002.jpg'
....
`````

#### usando un patrón de nombres
`````
ffmpeg -framerate 25 -pattern_type glob -i 'nombre_*-*--*.jpg' -c:v libx264 -pix_fmt yuv420p output.mp4
`````

Este parece que funciona mejor por poder controlar el framerate.

## Créditos
Este proyecto surge de la petición del fotógrafo [Samuel Nacar](https://www.instagram.com/samuel_nacar/?hl=es) paa  hacer un video con el que narrar la desconocida frontera entre Marruecos y el Sahara Occidental.

Este proyecto a su vez está inspirado por el documental [Best of Luck with the Wall](https://www.youtube.com/watch?v=sIe9p7tslpg) de Josh Begley.


Una vez solucionado el problema de Samuel, se me ocurrió que podía ser útil para otras personas y lo he publicado aquí.

Desarrollo: Sergio Galán | [The Graphic Method Studio](http://graphicmethod.studio)

## Licencia
Puedes hacer lo que quieras con este código. Es software libre.
MIT

Si lo has usado para hacer algun proyecto me encantaría verlo. Puedes escribirme a sergio-at-graphicmethod.studio
