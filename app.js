/*jslint browser: true, esnext: true */
import _ from 'lodash';
import chartist from 'chartist';
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
      var n = scope.statuses.length;
      var labels = new Array(n);
      var bikes_available = new Array(n);
      // var docks_available = new Array(n);

      var first_status = scope.statuses[0];

      scope.statuses.forEach((status, i) => {
        labels[i] = status.fetched;
        bikes_available[i] = status.bikes_available;
        // docks_available[i] = status.docks_available;
      });

      new chartist.Line(el[0], {
        // ['Bikes Available', 'Docks Available']
        labels: labels,
        series: [
          bikes_available,
        ]
      }, {
        high: first_status.bikes_available + first_status.docks_available,
        low: 0,
        showArea: true,
        fullWidth: true,
        height: 400,
        axisY: {
          // onlyInteger: true,
        },
        lineSmooth: chartist.Interpolation.none(),
        // lineSmooth: chartist.Interpolation.simple({divisor: 2}),
        chartPadding: {},
      });

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
