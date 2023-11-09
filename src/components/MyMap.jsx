import React, {useEffect, useRef, useState} from 'react';
import mapboxgl from 'mapbox-gl';
import "./mymap.css"
import {Button} from "antd";

import wuhan from "../assets/geo/Wuhan_Buildings.json"
import guangdong from "../assets/geo/guangdongProvince.json"
import hongshanqu from "../assets/geo/hongshanqu.json"
import earthquakes from "../assets/geo/earthquakes.json"
import {useDayOrNight} from "../hooks/DayOrNight.js";

mapboxgl.accessToken = 'pk.eyJ1IjoiemhvbmdkaXNodW1hIiwiYSI6ImNsNXJoYXR5eTI2bGgzZW53d2didWF1c3AifQ.6vOplM2NQc_xnJW3aA5ZBA';

function MyMap() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const resetMap = useRef(null);
    const fly = useRef(null);
    const clearAll = useRef(null);
    const markOn = useRef(null);
    const buildings = useRef(null);
    const heat = useRef(null);
    const [lng, setLng] = useState(114.4090);
    const [lat, setLat] = useState(30.4695);
    const [zoom, setZoom] = useState(1);
    const [pitch, setPitch] = useState(0);
    const [bearing, setBearing] = useState(0);
    const labels = []
    let hoveredStateId = null;
    let isMark = false;
    const [is,setIs] = useState(false)

    function markEvt(evt) {
        let {lng, lat} = evt.lngLat;
        let marker = new mapboxgl.Marker().setLngLat([lng, lat]);
        marker.addTo(map.current)
        labels.push(marker);
    }

    useEffect(() => {
        if (map.current) return; // initialize map only once

        const day = useDayOrNight()
        console.log(day)

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: day === "pm" ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: zoom,
            pitch: pitch
        });

        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
            setPitch(map.current.getPitch().toFixed(0));
            setBearing(map.current.getBearing().toFixed(0))
        });

        map.current.on("mousemove", (evt) => {
            let {lng, lat} = evt.lngLat;
            document.getElementById("mouse").innerHTML =
                `经度:${lng.toFixed(2)},纬度:${lat.toFixed(2)}`
        })

        /* 广东省高亮 */
        map.current.on('load', () => {
            map.current.addSource('states', {
                type: 'geojson',
                data: guangdong,
                generateId: true
            });

            // The feature-state dependent fill-opacity expression will render the hover effect
            // when a feature's hover state is set to true.
            map.current.addLayer({
                id: 'state-fills',
                type: 'fill',
                source: 'states',
                layout: {},
                paint: {
                    'fill-color': '#627BC1',
                    'fill-opacity': [
                        'case',
                        /* 设置要素鼠标悬停的状态 */
                        ['boolean', ['feature-state', 'hover'], false],
                        0.7,
                        0.2
                    ]
                }
            });

            map.current.addLayer({
                id: 'state-borders',
                type: 'line',
                source: 'states',
                layout: {},
                paint: {
                    'line-color': '#627BC1',
                    'line-width': 2
                }
            });

            // When the user moves their mouse over the state-fill layer, we'll update the
            // feature state for the feature under the mouse.
            map.current.on('mousemove', 'state-fills', (e) => {
                //console.log(e.features)
                if (e.features.length > 0) {
                    if (hoveredStateId !== null) {
                        map.current.setFeatureState(
                            {source: 'states', id: hoveredStateId},
                            {hover: false}
                        );
                    }
                    hoveredStateId = e.features[0].id;
                    map.current.setFeatureState(
                        {source: 'states', id: hoveredStateId},
                        {hover: true}
                    );
                }
            });

            // When the mouse leaves the state-fill layer, update the feature state of the
            // previously hovered feature.
            map.current.on('mouseleave', 'state-fills', () => {
                if (hoveredStateId !== null) {
                    map.current.setFeatureState(
                        {source: 'states', id: hoveredStateId},
                        {hover: false}
                    );
                }
                hoveredStateId = null;
            });

            //加入popup
            marker.addTo(map.current);

            //热力图(地震)
            map.current.addSource('earthquakes', {
                'type': 'geojson',
                'data': earthquakes
            });
            map.current.addLayer(
                {
                    id: 'earthquakes-heat',
                    type: 'heatmap',
                    source: 'earthquakes',
                    maxzoom: 9,
                    layout: { visibility: "none" },
                    paint: {
                        // Increase the heatmap weight based on frequency and property magnitude
                        'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
                        // Increase the heatmap color weight weight by zoom level
                        // heatmap-intensity is a multiplier on top of heatmap-weight
                        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
                        // Begin color ramp at 0-stop with a 0-transparancy color
                        // to create a blur-like effect.
                        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(33,102,172,0)', 0.2,
                            'rgb(103,169,207)', 0.4, 'rgb(209,229,240)', 0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)',
                            1, 'rgb(178,24,43)'
                        ],
                        // Adjust the heatmap radius by zoom level
                        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
                        // Transition from heatmap to circle layer by zoom level
                        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
                    }
                },
                'waterway-label'
            );
            map.current.addLayer(
                {
                    id: 'earthquakes-point',
                    type: 'circle',
                    source: 'earthquakes',
                    minzoom: 7,
                    layout: { visibility: "none" },
                    paint: {
                        // Size circle radius by earthquake magnitude and zoom level
                        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7,
                            ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 6, 4], 16,
                            ['interpolate', ['linear'], ['get', 'mag'], 1, 5, 6, 50]],
                        // Color circle by earthquake magnitude
                        'circle-color': [
                            'interpolate', ['linear'], ['get', 'mag'], 1, 'rgba(33,102,172,0)', 2, 'rgb(103,169,207)',
                            3, 'rgb(209,229,240)', 4, 'rgb(253,219,199)', 5, 'rgb(239,138,98)', 6, 'rgb(178,24,43)'
                        ],
                        'circle-stroke-color': 'white',
                        'circle-stroke-width': 1,
                        // Transition from heatmap to circle layer by zoom level
                        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 1]
                    }
                },
                'waterway-label'
            );
        });

        /* 定制化背景 */
        map.current.on("style.load", () => {
            map.current.setFog({})
            /* 直接加载网络数据  */
            map.current.addSource('hubei', {
                type: "geojson",
                data: hongshanqu,
                // data: 'https://geo.datav.aliyun.com/areas_v3/bound/420000_full.json'
            })
            /* 填充图层 */
            map.current.addLayer({
                id: "fill-hubei",
                type: "fill",
                source: 'hubei',
                paint: {
                    'fill-color': "#ff2d51",
                    'fill-opacity': 0.4,
                    'fill-outline-color': "green",
                }
            })
            /* 描边图层 */
            map.current.addLayer({
                id: "troke-hubei",
                type: "line",
                source: 'hubei',
                paint: {
                    'line-color': "#333",
                    'line-opacity': 0.8,
                    'line-width': 2
                }
            })
            /* 官方全球3d建筑图 */
            // map.current.addLayer({
            //     id: "3d-buildings",
            //     source: "composite",
            //     "source-layer": "building",
            //     filter: ["==", "extrude", "true"],
            //     type: "fill-extrusion",
            //     paint: {
            //         "fill-extrusion-color": "#7e7d7d",
            //         "fill-extrusion-height": ["get", "height"],
            //         "fill-extrusion-opacity": 0.6,
            //         //建筑离地面高度
            //         // 'fill-extrusion-base': 500
            //     },
            // });
            /* 官方中地武汉建筑图 很慢*/
            map.current.addSource("zhongdi", {
                type: "geojson",
                data: wuhan
            })
            map.current.addLayer({
                id: "3d-buildings",
                source: "zhongdi",
                type: "fill-extrusion",
                layout: { visibility: "none" },
                paint: {
                    "fill-extrusion-color": "#606060",
                    "fill-extrusion-height": ["get","Elevation"],
                    "fill-extrusion-opacity": 0.6,
                },
            });
        })

        /*  */
        const popup = new mapboxgl.Popup({})
            .setHTML('<div><h1>我的学校</h1><button>你好</button></div>')
        const marker = new mapboxgl.Marker({})
            .setLngLat([114.40766205584896, 30.46805264929955]).setPopup(popup);

        /* 给地图点击事件飞行到武汉 */
        fly.current.addEventListener("click", () => {
            // 漫游
            map.current.flyTo({
                //公司
                //center:[114.39787201365266,30.479374191380828],
                //学校
                center: [114.40766205584896, 30.46805264929955],
                zoom: 15,
                pitch: 60
            })
        })

        /* 点击地图添加点标记 */
        markOn.current.addEventListener("click", function () {
            if (isMark) {
                map.current.off('click', markEvt)
                isMark = false
                setIs(false)
            } else {
                map.current.on('click', markEvt)
                isMark = true
                setIs(true)
            }
        })

        /* 清楚所有标记 */
        clearAll.current.addEventListener('click', function () {
            labels.forEach(item => {
                item.remove()
            })
        })

        /* 复位地图 */
        resetMap.current.addEventListener('click', function () {
            map.current.flyTo({
                zoom: 1,
                pitch: 0
            })
        })

        /*建筑图动态显示*/
        buildings.current.addEventListener("click",function (){
            let visibility = map.current.getLayoutProperty("3d-buildings", "visibility");
            if (visibility === "visible") {
                map.current.setLayoutProperty("3d-buildings", "visibility", "none");
            } else {
                map.current.setLayoutProperty("3d-buildings", "visibility", "visible");
            }
        })

        /*热力图动态显示*/
        heat.current.addEventListener("click",function (){
            let visibility = map.current.getLayoutProperty("earthquakes-heat", "visibility");
            if (visibility === "visible") {
                map.current.setLayoutProperty("earthquakes-heat", "visibility", "none");
                map.current.setLayoutProperty("earthquakes-point", "visibility", "none");
            } else {
                map.current.setLayoutProperty("earthquakes-heat", "visibility", "visible");
                map.current.setLayoutProperty("earthquakes-point", "visibility", "visible");
            }
        })

        /* 全屏控件 */
        map.current.addControl(new mapboxgl.FullscreenControl())
        /* 导航控件 */
        map.current.addControl(
            new mapboxgl.NavigationControl(),
            /* top-left,top-right,bottom-right,bottom-left */
            'bottom-right'
        )
        /* 比例尺 */
        map.current.addControl(
            new mapboxgl.ScaleControl()
        )
        /* 汉化 */
        map.current.addControl(
            new MapboxLanguage({
                defaultLanguage: 'zh-Hans'
            })
        )
        //  增加小导航
        // map.current.addControl(
        //     new MapboxDirections({
        //         accessToken: mapboxgl.accessToken,
        //         unit: 'metric',  //设置单位公里
        //         profile: 'mapbox/driving',
        //         language: 'zh-CN'
        //     }),
        //     'top-left'
        // );
    });

    return (
        <div>
            <div className="button_group">
                <Button className="button_one" ref={resetMap}>复位地图</Button>
                <Button className="button_one" ref={fly}>飞向原点</Button>
                <Button className="button_one" ref={markOn}>{is ? "关闭标记模式":"开启标记模式"}</Button>
                <Button className="button_one" ref={clearAll}>清除所有标记</Button>
                <Button className="button_one" ref={heat}>热力图</Button>
                <Button className="button_one" ref={buildings}>建筑图</Button>
            </div>
            <div id="mouse"></div>
            <div className="sidebar">
                Longitude: {lng} | Latitude: {lat} | Zoom: {zoom} | Pitch: {pitch} | Bearing: {bearing}
            </div>
            <div ref={mapContainer} className="map-container"/>
        </div>
    )
}

export default MyMap;
