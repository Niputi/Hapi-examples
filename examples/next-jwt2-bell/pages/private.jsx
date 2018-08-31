import React, {Component} from "react";
import Auth from "../lib/auth";

export default class Secret extends Component {
    static async getInitialProps({req, res}) {
        return Auth(req, res);
    }

    render() {
        return <div>Secret Page</div>;
    }
}
