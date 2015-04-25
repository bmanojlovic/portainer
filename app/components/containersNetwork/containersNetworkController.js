angular.module('containersNetwork', ['ngVis'])
.controller('ContainersNetworkController', ['$scope', '$location', 'Container', 'Messages', 'VisDataSet', function($scope, $location, Container, Messages, VisDataSet) {
    $scope.options = {
      navigation: true,
      keyboard: true,
      height: '500px', width: '700px',
      nodes: {
        shape: 'box'
      },
      edges: {
        style: 'arrow'
      },
      physics: {
        barnesHut : {
          springLength: 200
        }
      }
    };
    $scope.data = new ContainersNetwork();
    $scope.events = {
      doubleClick : function(event) {
        $scope.$apply( function() {
          $location.path('/containers/' + event.nodes[0]);
        });
      }
    };

    function ContainersNetwork() {
        this.containers = [];
        this.nodes = new VisDataSet();
        this.edges = new VisDataSet();

        this.add = function(data) {
            var container = new ContainerNode(data);
            this.containers.push(container);
            this.nodes.add({id: container.Id, label: container.Name});
            for (var i = 0; i < this.containers.length; i++) {
                var otherContainer = this.containers[i];
                this.addLinkEdgeIfExists(container, otherContainer);
                this.addLinkEdgeIfExists(otherContainer, container);
                this.addVolumeEdgeIfExists(container, otherContainer);
                this.addVolumeEdgeIfExists(otherContainer, container);
            }
        }

        this.addLinkEdgeIfExists = function(from, to) {
            if (from.Links != null && from.Links[to.Name] != null) {
                this.edges.add({ from: from.Id, to: to.Id, label: from.Links[to.Name] });
            }
        }

        this.addVolumeEdgeIfExists = function(from, to) {
            if (from.VolumesFrom != null && from.VolumesFrom[to.Id] != null) {
                this.edges.add({ from: from.Id, to: to.Id, color: { color: '#A0A0A0', highlight: '#A0A0A0', hover: '#848484'}});
            }
        }
    }

    function ContainerNode(data) {
        this.Id = data.Id;
        this.Name = data.Name.substring(1, data.Name.length);
        var dataLinks = data.HostConfig.Links;
        if (dataLinks != null) {
            this.Links = [];
            for (var i = 0; i < dataLinks.length; i++) {
                // links have the following format: /TargetContainerName:/SourceContainerName/LinkAlias
                var link = dataLinks[i].split(":");
                var target = link[0].split("/")[1];
                var alias = link[1].split("/")[2];
                // only keep shortest alias
                if (this.Links[target] == null || alias.length < this.Links[target].length) {
                    this.Links[target] = alias;
                }
            }
        }
        var dataVolumes = data.HostConfig.VolumesFrom;
        //converting array into properties for simpler and faster access
        if (dataVolumes != null) {
            this.VolumesFrom = [];
            for (var i = 0; i < dataVolumes.length; i++) {
                this.VolumesFrom[dataVolumes[i]] = true;
            }
        }
    }

    Container.query({all: 0}, function(d) {
        for (var i = 0; i < d.length; i++) {
            Container.get({id: d[i].Id}, function(d) {
                    $scope.data.add(d);
                }, function(e) {
                    Messages.error('Failure', e.data);
                });

        }
   });
}]);
