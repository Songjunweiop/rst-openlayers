<template>
  <div>
    <!-- 地图 -->
    <div id="map" style="width: 98vw; height: 89vh"></div>
    <div id="position"></div>
    <div style="position: absolute; top: 50px; left: 50px">
      <button @click="routePlayback">路径回放</button>
      路程距离：{{ this.distance }}
      <label for="speed">
        运动速度:&nbsp;
        <input id="speed" type="range" step="10" value="100" />
      </label>
      <button @click="handlePlay">{{ textContent }}</button>
    </div>
  </div>
</template>

<script>
import 'ol/ol.css'
import { Map, View } from 'ol'
import { Vector as VectorLayer, Tile as TileLayer } from 'ol/layer'
import { transform } from 'ol/proj'
import { Vector as VectorSource, XYZ as XYZSource } from 'ol/source'
import * as olControl from 'ol/control'
import * as olInteraction from 'ol/interaction'
import { Stroke, Style, Fill, Circle, Icon } from 'ol/style'
import Feature from 'ol/Feature'
import { Point, Polygon, LineString } from 'ol/geom'
import { getVectorContext } from 'ol/render'

export default {
  name: 'GaodeAPI',
  data() {
    return {
      map: null,
      pointLayer: null,
      polygonLayer: null,
      lineLayer: null,
      drawLayer: null,
      pointsData: [],
      polygonData: [],
      lineData: [],
      distance: null,
      pointLine: [
        {
          lineCoordinate: [],
        },
      ],
      lineLength: null,
      markerFeature: null,
      textContent: '开始',
      isMarkMove: false,
      now: null,
      speed: null,
      markStyle: new Style({
        image: new Icon({
          anchor: [0.5, 1], // 偏移位置
          // rotation: 0, // 旋转
          // size: [100, 100], // 图标大小
          src: require('@/assets/walking.png'),
        }),
      }),
    }
  },
  created() {
    this.pointsData = [
      {
        id: '1',
        mark: '11军',
        coordinate: [102, 25],
      },
      {
        id: '2',
        mark: '2师',
        coordinate: [104.152038, 30.634342],
      },
      {
        id: '3',
        mark: '3旅',
        coordinate: [106.494789, 29.612073],
      },
      {
        id: '4',
        mark: '4团',
        coordinate: [108, 30],
      },
      {
        id: '5',
        mark: '5营',
        coordinate: [106, 36],
      },
      {
        id: '6',
        mark: '5连',
        coordinate: [121, 25],
      },
    ]
    this.polygonData = [
      {
        id: '01',
        math: '1523m²',
        mark: '多边形1的备注',
        polygonCoordinate: [
          [100, 30],
          [110, 20],
          [120, 40],
        ],
      },
      {
        id: '02',
        math: '666m²',
        mark: '多边形2的备注',
        polygonCoordinate: [
          [125, 30],
          [130, 20],
          [135, 40],
        ],
      },
    ]
    this.lineData = [
      {
        id: '01',
        math: '33m',
        mark: '11军',
        lineCoordinate: [
          [103, 40],
          [105, 38],
          [107, 39],
          [107, 37],
          [108, 37],
          [110, 35],
          [111, 32],
          [112, 31],
          [114, 30],
        ],
      },
    ]
  },
  mounted() {
    this.initMap()
    this.routePlayback()
    this.$nextTick(() => {
      // 模拟点动
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          this.pointsData[0].coordinate[0] += Math.random() * 2
          this.pointsData[0].coordinate[1] -= Math.random() * 2
          this.renderPointLayer()
        }, 1000 * i)
      }
    })
  },
  methods: {
    // 初始化map
    initMap() {
      const source = new XYZSource({
        // maxZoom: 15,
        url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7', //矢量地图（含路网，含注记）
        // url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=7", // 为矢量图（含路网，不含注记）
        // url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8', //影像路图（含路网，含注记）
        // url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=7', //影像路图（含路网，不含注记）
        // url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}", //使用高德地图图层
        // url:
        //   "https://services.arcgisonline.com/arcgis/rest/services/" +
        //   "ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}",
        // projection: "EPSG:4326",
        // // projection: "EPSG:3857",
        // tileSize: 512, // the tile size supported by the ArcGIS tile service
        // maxResolution: 180 / 512, // Esri's tile grid fits 180 degrees on one 512 px tile
        // wrapX: false,
      })
      const raster = new TileLayer({
        source: source,
      })
      this.map = new Map({
        layers: [raster],
        target: 'map',
        view: new View({
          // projection: "EPSG:4326", //正确
          // projection: "EPSG:3857",
          center: transform([105.54859, 30.2824], 'EPSG:4326', 'EPSG:3857'),
          zoom: 9,
          minZoom: 2,
          maxZoom: 15,
        }),
        interactions: new olInteraction.defaults({
          doubleClickZoom: false,
          mouseWheelZoom: true,
        }).extend([new olInteraction.DragRotateAndZoom()]), //按住Shift旋转放大
        controls: olControl.defaults().extend([
          new olControl.FullScreen(),
          new olControl.ZoomSlider(),
          new olControl.MousePosition({
            projection: 'EPSG:4326',
            target: 'position',
          }),
        ]),
      })
      this.renderPointLayer()
      this.setPointerMove()
    },
    // 渲染点图
    renderPointLayer() {
      if (this.pointLayer) this.map.removeLayer(this.pointLayer)
      let features = []
      this.pointsData.map((curpoint) => {
        features.push(
          new Feature({
            geometry: new Point(
              transform(curpoint.coordinate, 'EPSG:4326', 'EPSG:3857')
            ),
            ...curpoint,
          })
        )
      })
      const vectorPointSource = new VectorSource({
        features: [],
      })
      vectorPointSource.addFeatures(features)

      this.pointLayer = new VectorLayer({
        title: 'mypointLayer',
        source: vectorPointSource,
        style: new Style({
          image: new Circle({
            radius: 5,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'red', size: 1 }),
          }),
        }),
      })
      this.map.addLayer(this.pointLayer)
    },
    // 渲染线
    renderLineLayer(lineData) {
      if (this.lineLayer) this.map.removeLayer(this.lineLayer)
      let lineFeatures = []
      lineData.map((curline) => {
        const newCoord = curline.lineCoordinate.map((curCoord) => {
          return transform(curCoord, 'EPSG:4326', 'EPSG:3857')
        })
        lineFeatures.push(
          new Feature({
            geometry: new LineString(newCoord),
            ...curline,
          })
        )
      })
      const vectorLineSource = new VectorSource({
        features: [],
      })
      vectorLineSource.addFeatures(lineFeatures)
      this.lineLayer = new VectorLayer({
        title: 'mylineLayer',
        source: vectorLineSource,
        style: new Style({
          stroke: new Stroke({ color: 'red', width: 2 }),
        }),
      })
      this.map.addLayer(this.lineLayer)
    },
    // 渲染多边形图
    renderPolygonLayer() {
      if (this.polygonLayer) this.map.removeLayer(this.polygonLayer)
      let polygonFeatures = []
      this.polygonData.map((curpolygon) => {
        const newCoordinate = curpolygon.polygonCoordinate.map((curCoord) => {
          return transform(curCoord, 'EPSG:4326', 'EPSG:3857')
        })
        polygonFeatures.push(
          new Feature({
            geometry: new Polygon([newCoordinate]),
            ...curpolygon,
          })
        )
      })

      const vectorPolygonSource = new VectorSource({
        features: [],
      })
      vectorPolygonSource.addFeatures(polygonFeatures)

      this.polygonLayer = new VectorLayer({
        source: vectorPolygonSource,
      })
      this.map.addLayer(this.polygonLayer)
    },
    // map移入feature中事件
    setPointerMove() {
      this.map.on('pointermove', (e) => {
        var pixel = this.map.getEventPixel(e.originalEvent)
        const feature = this.map.forEachFeatureAtPixel(
          pixel,
          (feature) => feature
        )
        if (feature) {
          this.map.getTargetElement().style.cursor = 'pointer'
        } else {
          this.map.getTargetElement().style.cursor = ''
        }
      })
    },
    // 获取路径
    async getRoute() {
      const { data: res } = await this.$http.get(
        'https://restapi.amap.com/v3/direction/driving',
        {
          params: {
            key: '7d9ec609c8a1442a181512523846e711',
            origin: '104.152038,30.634342',
            destination: '106.494789,29.612073',
          },
        }
      )
      if (res.status === '1') {
        this.distance = res.route.paths[0].distance
        console.log(res.route.paths[0].steps)
        this.pointLine[0].lineCoordinate = res.route.paths[0].steps.reduce(
          (result, curStep) => {
            const a = curStep.polyline
              .split(';')
              .map((cur) => cur.split(',').map((cur) => Number(cur)))
            result = result.concat(a)
            return result
          },
          []
        )
        this.lineLength = this.pointLine[0].lineCoordinate.length
        this.renderLineLayer(this.pointLine)
      }
    },
    // 路径回放
    async routePlayback() {
      await this.getRoute()
      console.log(this.pointLine[0].lineCoordinate[0])
      this.markerFeature = new Feature({
        geometry: new Point(
          transform(
            this.pointLine[0].lineCoordinate[0],
            'EPSG:4326',
            'EPSG:3857'
          )
        ),
      })
      this.drawLayer = new VectorLayer({
        source: new VectorSource({
          features: [this.markerFeature],
        }),
        style: this.markStyle,
      })
      this.map.addLayer(this.drawLayer)
    },
    handlePlay() {
      if (this.textContent === '暂停') {
        this.stop()
      } else {
        this.start()
      }
    },
    moveFeature(event) {
      let vectorContext = getVectorContext(event)
      // console.log(Math.random() * 2 + vectorContext)
      let frameState = event.frameState
      if (this.isMarkMove) {
        let elapsedTime = frameState.time - this.now
        let index = Math.round((this.speed * elapsedTime) / 1000)
        if (index >= this.lineLength) {
          this.stop()
          return
        }
        console.log(22222222222222)

        const currentPoint = new Point(
          transform(
            this.pointLine[0].lineCoordinate[index],
            'EPSG:4326',
            'EPSG:3857'
          )
        )
        const feature = new Feature(currentPoint)
        vectorContext.drawFeature(feature, this.markStyle)
        this.map.render() // 开始移动动画
      }
    },
    start() {
      console.log(111)
      if (this.isMarkMove) {
        this.stop()
      } else {
        console.log(111111111111)
        this.isMarkMove = true
        this.textContent = '暂停'
        this.now = new Date().getTime()
        this.speed = document.getElementById('speed').value
        this.markerFeature.setStyle(null) // hide geoMarker 隐藏标记
        // this.map.removeLayer(this.drawLayer)
        // this.map.getView().setCenter(this.center) // 设置下中心点
        console.log(11111122222)
        this.drawLayer.on('postrender', this.moveFeature)
        this.map.render()
      }
    },
    stop() {
      console.log(33333333333)
      this.isMarkMove = false
      this.textContent = '开始'
      this.drawLayer.un('postrender', this.moveFeature) // 删除侦听器
    },
  },
}
</script>
