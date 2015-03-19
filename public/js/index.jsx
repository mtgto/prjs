var PullRequest = React.createClass({
    render: function() {
        return (
            <a className="list-group-item" href={this.props.data.html_url}>
                <p>{this.props.data.title}</p>
                <small className="list-group-item-text">#{this.props.data.number} by {this.props.data.user.login}</small>
            </a>
        );
    }
});

var AddRepositoryForm = React.createClass({
    getInitialState: function() {
        return {hasError: false};
    },
    handleSubmit: function(e) {
        e.preventDefault();
        var repositoryName = this.refs.repo.getDOMNode().value.trim();
        var form = this;
        this.props.onRepositorySubmit(repositoryName, function(err) {
            if (err) {
                form.setState({hasError: true});
            }
        });
        this.refs.repo.getDOMNode().value = '';
    },
    render: function() {
        var cx = React.addons.classSet;
        var classes = cx({
            'form-group': true,
            'has-error': this.state.hasError
        });
        return (
            <form className="form-inline" onSubmit={this.handleSubmit}>
                <div className={classes}>
                    <label className="sr-only">Subscribe other repository</label>
                    <input className="form-control" type="text" ref="repo" placeholder="ex. owner/repo"></input>
                </div>
                <button className="btn btn-primary" type="submit">Add</button>
            </form>
        );
    }
});

var DeleteRepositoryAlert = React.createClass({
    handleClick: function(e) {
        $('#myModal').modal('hide');
        this.props.onUnsubscribe(this.props.repositoryName);
    },
    render: function() {
        return (
            <div className="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 className="modal-title">Confirm</h4>
                        </div>
                        <div className="modal-body">
                            Are you sure to delete repository {this.props.repositoryName}?
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={this.handleClick}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

var UnsubscribeAnchor = React.createClass({
    handleClick: function(e) {
        e.preventDefault();
        this.props.onUnsubscribeClick(this.props.repositoryName);
        $('#myModal').modal();
    },
    render: function() {
        return (
            <a className="pull-right" href="#" onClick={this.handleClick}>Unsubscribe</a>
        );
    }
});

var RepositoryList = React.createClass({
    getInitialState: function() {
        return {data: []};
    },
    componentDidMount: function() {
        $.ajax({
            url: 'api/pulls',
            dataType: 'json',
            success: function(data) {
                this.setState({data: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    handleRepositorySubmit: function(repositoryName, callback) {
        $.ajax({
            type: 'POST',
            url: 'api/repos/add',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({name: repositoryName, _csrf: csrfToken}),
            success: function(data) {
                var newData = this.state.data.concat([data]);
                this.setState({data: newData});
                callback(null);
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
                callback(err);
            }.bind(this)
        });
    },
    handleUnsubscribeClick: function(repositoryName) {
        this.setState({deleteRepositoryName: repositoryName});
        $('#myModal').modal();
    },
    handleUnsubscribe: function(repositoryName) {
        $.ajax({
            type: 'POST',
            url: 'api/repos/delete',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({name: repositoryName, _csrf: csrfToken}),
            success: function (data) {
                var newData = this.state.data.filter(function(e) {
                    return e['name'] != repositoryName;
                });
                this.setState({data: newData});
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function() {
        var self = this;
        var repositoryNodes = null;
        if (this.state.data.length > 0) {
            repositoryNodes = this.state.data.map(function(repository) {
                var pullRequestNodes = null;
                if (repository.pulls.length > 0) {
                    pullRequestNodes = repository.pulls.map(function(pullRequest) {
                        return (
                            <PullRequest data={pullRequest}/>
                        );
                    });
                } else {
                    pullRequestNodes =
                        <div className="panel-body">No open pull request</div>;
                }
                return (
                    <div className="panel panel-default">
                        <div className="panel-heading">
                        {repository['name']}
                            <UnsubscribeAnchor repositoryName={repository['name']} onUnsubscribeClick={self.handleUnsubscribeClick}/>
                        </div>
                    {pullRequestNodes}
                    </div>
                )
            });
        } else {
            repositoryNodes = <p>You are watching no repository!</p>;
        }
        return (
            <div className="row">
                <h2>Watching</h2>
                <DeleteRepositoryAlert repositoryName={this.state.deleteRepositoryName} onUnsubscribe={this.handleUnsubscribe}/>
                {repositoryNodes}
                <h3>Subscribe other repository</h3>
                <AddRepositoryForm onRepositorySubmit={this.handleRepositorySubmit}/>
            </div>
        );
    }
});
React.render(
    <RepositoryList />,
    document.getElementById('content')
);
