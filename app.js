/*jslint browser: true, esnext: true */
import _ from 'lodash';
import d3 from 'd3';
import angular from 'angular';
import 'angular-ui-router';
import 'ngstorage';

var app = angular.module('app', [
  'ui.router',
  'ngStorage',
]);

app.config(($stateProvider, $urlRouterProvider) => {
  $urlRouterProvider.otherwise(() => {
    return '/programs';
  });

  $stateProvider
  .state('programs', {
    url: '/programs',
    templateUrl: 'templates/programs.html',
    controller: 'programsCtrl',
  })
  .state('programs.program', {
    url: '/{id:int}',
    templateUrl: 'templates/program.html',
    controller: 'programCtrl',
  });
});

const server = 'http://localhost:1080';

app.controller('programsCtrl', ($scope, $http, $state) => {
  // console.log('$state.params: %j', $state.params);
  $scope.program_id = $state.params.id;
  $http.get(server + '/programs').then(res => {
    $scope.programs = res.data;
  });
  $scope.change = () => {
    $state.go('programs.program', {id: $scope.program_id});
  };
});

app.directive('statusGraph', function() {
  return {
    restrict: 'E',
    scope: {
      statuses: '=',
    },
    link: function(scope, el) {
      var statuses = scope.statuses;
      statuses.forEach(status => status.fetched = new Date(status.fetched));

      var bounds = el[0].getBoundingClientRect();

      // mostly from http://bl.ocks.org/mbostock/3883195
      var margin = {top: 20, right: 20, bottom: 30, left: 50};
      var width = bounds.width;
      var height = 200;
      var inner_width = width - margin.left - margin.right;
      var inner_height = height - margin.top - margin.bottom;

      var x = d3.time.scale().range([0, inner_width]);
      var y = d3.scale.linear().range([inner_height, 0]);

      var xAxis = d3.svg.axis().scale(x).orient('bottom');
      var yAxis = d3.svg.axis().scale(y).orient('left');

      var area = d3.svg.area()
          .x(status => x(status.fetched))
          .y0(inner_height)
          .y1(status => y(status.bikes_available));

      var svg = d3.select(el[0]).append('svg')
          .attr('width', width)
          .attr('height', height)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      x.domain(d3.extent(statuses, status => status.fetched));
      y.domain([0, d3.max(statuses, status => status.bikes_available + status.docks_available)]);

      svg.append('path')
        .datum(statuses)
        .attr('class', 'area')
        .attr('d', area);

      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + inner_height + ')')
        .call(xAxis);

      svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    }
  };
});


app.controller('programCtrl', ($scope, $http, $state) => {
  $http.get(server + '/statuses', {params: {programId: $state.params.id}}).then(res => {
    var statuses = res.data;
    /**
    {
      "bcycle_id": 2498,
      "name": "Convention Center / 4th St. @ MetroRail",
      "description": "Station south of MetroRail Platform",
      "street": "499 E. 4th St",
      "city": "Austin",
      "state": "TX",
      "zip_code": "78701",
      "country": "United States",
      "latitude": "30.26483",
      "longitude": "-97.739",
      "time_zone": "(UTC-06:00) Central Time (US & Canada)",
      "status": "Active",
      "is_event_based": false,
      "docks_available": 7,
      "bikes_available": 10,
      "fetched": "2015-07-19T21:29:57.644Z"
    }
    */
    // for (var i = 1, status; (status = statuses[i]) !== undefined; i++) {
    //   var statuses = $scope.kiosks[status.name];
    // }
    $scope.kiosks = _.groupBy(statuses, 'name');
  });
});
