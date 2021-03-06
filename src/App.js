import React, { useEffect, useRef, Fragment } from "react";
import ReactDOMServer from 'react-dom/server';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import "./styles/styles.css";
import "./styles/tip.css";
import json from './data/data.json'

export default function App() {

	const chartArea = useRef(null);
	const margin = { left: 50, right: 50, top: 10, bottom: 40 };
	const timer = 800;

	useEffect(() => {
		startChart();
	});

	function area(r) {
		return (Math.pow(r, 2) * Math.PI)
	}

	function startChart() {
		const width = chartArea.current.clientWidth - margin.left - margin.right,
			height = (document.documentElement.clientHeight - 80) - margin.top - margin.bottom;
		const timer = 800;

		var index = 0;

		var g = d3.select("#chart-area")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left}, ${margin.top})`);

		var x = d3.scaleLog()
			.domain([100, 200000])
			.range([0, width]);

		var xAxis = g.append("g")
			.attr("class", "x axis")
			.attr('transform', `translate(0, ${height})`);

		var y = d3.scaleLinear()
			.domain([0, 90])
			.range([height, 0]);

		var yAxis = g.append("g")
			.attr("class", "y axis")
			.attr('transform', `translate(0, 0)`);

		var xAxisCall = d3.axisBottom(x)
			.tickValues([400, 4000, 40000])
			.tickFormat((d) => { return `$${d}` })

		var yAxisCall = d3.axisLeft(y);

		xAxis.call(xAxisCall)
		yAxis.call(yAxisCall)

		var xLabel = g.append('text')
			.text('GDP Per Capita')
			.attr('x', width / 2)
			.attr('y', (height + margin.bottom - 5))
			.attr('text-anchor', 'middle')
			.attr('font-size', '18px')
			.attr('text-anchor', 'middle')

		var yLabel = g.append('text')
			.attr('x', -(height / 2))
			// .attr('y', -(margin.left - margin.right))
			.attr('y', -30)
			.attr('text-anchor', 'middle')
			.attr('font-size', '18px')
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.text('Life Expectancy (Years)')

		var yearLabel = g.append('text')
			.attr('x', width)
			.attr('y', (height - 3))
			.attr('class', 'year-label');

		var t = d3.transition().duration(timer / 2);

		addLegend(g, width, height);

		var tip = d3Tip()
			.attr('class', 'd3-tip')
			.html((d) => {
				let html = (
					<Fragment>
						<div>
							<span>Country:</span><span className='ml-2 tiptext'>{d.country}</span>
						</div>
						<div>
							<span>Continent:</span><span className='ml-2 tiptext'>{d.continent}</span>
						</div>
						<div>
							<span>Life Expectancy:</span><span className='ml-2 tiptext'>{d3.format('.2f')(d.life_exp)}</span>
						</div>
						<div>
							<span>GDP Per Capita:</span><span className='ml-2 tiptext'>{d3.format('$,.0f')(d.income)}</span>
						</div>
						<div>
							<span>Population:</span><span className='ml-2 tiptext'>{d3.format(',.0f')(d.population)}</span>
						</div>
					</Fragment>
				)
				return ReactDOMServer.renderToStaticMarkup(html);
			});

		g.call(tip);

		var update = () => {
			let data = json[index].countries;
			data = data.filter((v) => {
				return (!v.income || !v.life_exp) ? false : true
			});

			var r = d3.scaleLinear()
				.domain([d3.min(data, (d) => { return d.population }), d3.max(data, (d) => { return d.population })])
				.range([area(5), area(25)]);

			yearLabel.text(`${json[index].year}`);

			let radius = 5;

			var points = g.selectAll("circle")
				.data(data, (d) => { return d.country });

			points.exit()
				.attr('cy', y(0))
				.remove();

			points.enter()
				.append("circle")
				.attr("cy", function (d) { return y(0) })
				.attr("cx", function (d) { return x(d.income) })
				.attr('r', function (d) { return Math.sqrt(r(d.population) / Math.PI) })
				.on('mouseover', tip.show)
				.on('mouseout', tip.hide)
				.merge(points)
				.transition(t)
				.attr("class", (d) => { return `point fill-${d.continent}` })
				.attr("cy", function (d) { return y(d.life_exp) })
				.attr("cx", function (d) { return x(d.income) });
		}

		setInterval(() => {
			(index === (json.length - 1)) ? index = 0 : index++;
			update();
		}, timer);
		update();
	}

	function addLegend(g, width, height) {
		var legendGroup = g.append('g');
		
		['Asia', 'Africa', 'Europe', 'Americas'].map((v, i) => {
			let y = i * 40
			legendGroup.append('rect')
				.attr('width', 10)
				.attr('height', 10)
				.attr('x', (width + (margin.right / 2)) - 5)
				.attr('class', `point fill-${v.toLowerCase()}`)
				.attr('y', y)
			legendGroup.append('text')
				.attr('x', (width + (margin.right / 2)))
				.attr('y', y + 25)
				.attr('class', 'legend')
				.text(v)
		});

		legendGroup.attr('transform', `translate(0, 70)`)
	}


	return (
		<div className="App">
			<nav className="navbar navbar-default">
				<div className="container">
					<a className="navbar-brand" href="#"><img id="logo" src="img/logo.png" /></a>
				</div>
			</nav>

			<div className="container">
				<div id="chart-area" ref={chartArea}></div>
			</div>
		</div>
	);
}
