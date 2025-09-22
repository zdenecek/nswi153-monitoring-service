## Monitoring service

The objective is to implement a simple monitoring service, similar to e.g. [UptimeRobot](https://uptimerobot.com/) as a seminar **team** project.

## Team

You are expected to form teams of size 2. Size 1 or 3 may be allowed. Once you form a team send me an e-mail with all team members. I will create a GitLab repository for your team. You should commit to the github on a regular basis as you develop the application.

You should form a team and send the e-mail before 1.April 2025.

## Introduction

A user should be able to create one or more projects. A _project_ consists of:

-   Label
-   Description
-   Tags - list of user-given strings

For a given _project_ the user can create _monitors_. One _project_ can contain zero or more monitors. A _monitor_ represents a monitoring task and consists of:

-   Label
-   Periodicity - how often should the monitor be checked in seconds The allowed range is between 5 and 300 seconds
-   Type - monitoring type, see below.
-   Badge label - used as a value for a badge, see below.

Each _monitor_ represents a monitoring task that will be periodically executed. The _monitor status_ represents the result of the monitoring task: _succeeded_ or _failed_. There are the following monitor types:

## Ping monitor

The purpose of this monitor is to imitate the ping command. The monitor is expected to open a TCP/IP connection. It should not validate a certificate, send, or receive any necessary data. The monitor fails when the connection can not be established, otherwise, the monitor succeeds. This monitor adds the following to the definition:

-   Port - port to connect to
-   Host name or IP address

## Website monitor

The purpose of this monitor is to check a web server. The web server may serve data using HTTP or HTTPS. The monitor is expected to open an HTTP or HTTPS connection to the server and download page content. The monitor fails when the connection can not be established. This monitor adds the following to the definition:

-   URL - URL to connect to
-   Check status - It true, the monitor fails when status is not in <200, 300\]
-   Keywords - list of keywords. The monitor fails if any of the keywords is not part of the response

## Monitoring

A monitor check is an act of evaluating the monitor rules. The application should not use the same backend to server HTTP and perform monitor checks! For each monitor check you need to remember:

-   Time of start
-   Status - result of the monitoring task
-   Response time - how long did it take to obtain the data from the server

## Views

The application should provide the following views/pages. You are more than welcome to add additional views to enhance user experience. Each view should have its own URL.

## Landing page

Information about project purpose, link to repository with code.

## Project list

A user should be able to create and delete a project. The list of projects should be paginated. The user should be able to filter the list using labels, and tags. The user should be able to sort the list using labels in ascending and descending order.

## Project detail

On the project detail page user can change the project properties: a label, a description and tags. The user can also create and delete monitors. Existing monitors are visible as a paginated list. The user should be able to filter the list using label, type, and latest status.

## Monitor detail

Here user can edit detail of a selected monitor. In addition, a user can see history of the monitoring using multiple modes. Each mode must provide live updates with at most 5-seconds interval. The live update must not do a full page reload!

### List mode

The user should be able to see the monitoring history using a paginated and filterable list. The filters should allow for time and status filtering. The list should be sorted from newest to oldest.

### Calender mode

As an alternative, the user should be able to view status results using a calendar view. The calendar view should span at least three months. Each day in a month should be represented by a colored box. The box should be green when there is no failure for a given monitor for a given day. The box should be orange when there are at most 5% of failures. Otherwise, the box should be red.

### Graph mode

In this mode, the user can view a 2D graph. The Y axis (vertical) represents _Response time_ and X axis (horizontal) _Time of start_. The purpose of this visualisation is to provide the user with an idea about server response time.

## API

The application's backend should expose data using at least two APIs described below. You can introduce additional API should you need it.

## RESTfull API

The API should respect RESTfull design principles and should be documented using OpenAPI / Swagger. The API should include resources for _project_, _monitor_ and read-only monitor status.

## GraphQL

The API should implement the following schema:

```

type Query {
  projects: [Project!]!
  status(
    monitorIdentifier: String!
    from: Int
    to: Int
  ): [Status!]
}

type Project {
  identifier: ID!
  label: ID!
  description: ID!
  monitors: [Monitor!]
}

type Monitor {
  identifier: ID!
  periodicity: Int
  label: ID!
  type: String!
  host: String
  url: String
  badgeUrl: String!
}

type Status {
  date: String!
  ok: Boolean!
  responseTime: Int
}
```

The Status.ok is true the the status is _succeeded_. The Status.date should use xsd:DataTime to represent the _Time of start_.

You may expand the schema to fit your needs. Keep in mind that you are not required to consume any of those APIs in you application.

## HTTP batch API

The objective of this API is to provide [badge](https://shields.io/badges) support. In response to GET request to this API you need to send back SVG badge reflecting the last monitor status. The badge consists of left text (label), right text (value), and color. The label is determined by the monitor's badge label. The value is "succeeded" or "failed" based on the last monitor status. The color is green or red based on the last monitor status. Examples:

![](https://img.shields.io/badge/badge_label-up-green)  
![](https://img.shields.io/badge/badge_label-down-red)

## Deployment

The application should be configurable using ".env" file. The user should be able to execute the configuration using the following command in an empty directory.

```

git clone {your repository to clone} .
docker compose up
```

## Data persistence

At least some part of the application data should be stored in a database. You are allowed to use more than one database.

All data should be persisted on a named volume. As a result, the data should persists restart of the docker compose.

## Documentation

You are not required to create detailed user or developer documentation. Instead provide a README.md file for your repository.

The README.md file should contain:

1.  Project name
2.  Brief description
3.  Installation instruction

## Code quality

You should employ linters for most of your codebase. You should employ a prettier when possible.

## FAQ

Please you the Unofficial [feedback form](https://forms.gle/bXEzm1mVQvhxPdS79) or an e-mail to submit your questions.

Q: Where can I find a teammate?  
Look around you, use Mattermost channel (nswi153), you can also send me an e-mail.

Q: Is there a deadline?  
Yes, you need to present you project before the end of the academic year. I highly suggest to do so during, or briefly after, the summer exam period.