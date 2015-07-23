/*jslint browser: true, esnext: true */
import _ from 'lodash';
import d3 from 'd3';
import angular from 'angular';
import 'angular-ui-router';

var app = angular.module('app', [
  'ui.router',
]);

app.config(($stateProvider, $urlRouterProvider) => {
  $urlRouterProvider.otherwise(() => {
    return '/programs';
  });

  $stateProvider
  .state('programs', {
    url: '/programs',
    templateUrl: 'templates/programs.html',
    controller: 'configCtrl',
  })
  .state('programs.program', {
    url: '/{id:int}',
    templateUrl: 'templates/program.html',
    controller: 'programCtrl',
  });
});

app.controller('configCtrl', ($scope, $http, $state) => {
  $scope.server = localStorage.bcycle_server;

  $scope.changeServer = () => {
    localStorage.bcycle_server = $scope.server;
    $state.reload();
  };

  $scope.program_id = $state.params.id;
  $http.get(localStorage.bcycle_server + '/programs').then(res => {
    $scope.programs = res.data;
  });
  $scope.changeProgram = () => {
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

      var bounds = el[0].getBoundingClientRect();

      // mostly from http://bl.ocks.org/mbostock/3883195
      var margin = {top: 5, right: 10, bottom: 20, left: 30};
      var width = bounds.width;
      var height = 150;
      var inner_width = width - margin.left - margin.right;
      var inner_height = height - margin.top - margin.bottom;

      var x = d3.time.scale()
        .domain(d3.extent(statuses, status => status.fetched))
        .range([0, inner_width]);
      var yMax = d3.max(statuses, status => status.bikes_available + status.docks_available);
      var y = d3.scale.linear()
        .domain([0, yMax])
        .range([inner_height, 0]);

      var xAxis = d3.svg.axis().scale(x).orient('bottom');
      var yAxis = d3.svg.axis().scale(y).orient('left');

      var area = d3.svg.area()
          .x(status => x(status.fetched))
          .y0(inner_height)
          .y1(status => y(status.bikes_available))
          .interpolate('monotone');

      var svg = d3.select(el[0]).append('svg')
          .attr('width', width)
          .attr('height', height)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // vertical grid lines
      var line = d3.svg.line()
        .x(status => x(status.fetched))
        .y(status => y(status.y));
      var bar = statuses => {
        var segments = statuses.map(status => {
          return line([{fetched: status.fetched, y: 0}, {fetched: status.fetched, y: yMax}]);
        });
        return segments.length ? segments.join('') : null;
      };
      svg.append('g')
        .attr('class', 'y grid')
        .append('path')
          .datum(statuses)
          .attr('d', bar);

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

const status_fields = ['docks_available', 'bikes_available', 'fetched'];

app.controller('programCtrl', ($scope, $http, $state) => {
  $http.get(localStorage.bcycle_server + '/statuses', {params: {programId: $state.params.id}}).then(res => {
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
    // $scope.kiosks = _.groupBy(statuses, status => status.name);
    var kiosksObj = {};
    for (var i = 0, status; (status = statuses[i]) !== undefined; i++) {
      var kiosk = kiosksObj[status.name];
      if (kiosk === undefined) {
        kiosk = kiosksObj[status.name] = _.omit(status, status_fields);
        kiosk.statuses = [];
      }
      status.fetched = new Date(status.fetched);
      kiosk.statuses.push(_.pick(status, status_fields));
    }
    var kiosks = _.values(kiosksObj);
    // wtf is with jslint here:
    kiosks.forEach((kiosk) => {
      kiosk.statuses = _.sortBy(kiosk.statuses, 'fetched');
    });
    $scope.kiosks = kiosks;
  });
});
