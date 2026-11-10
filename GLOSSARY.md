# Cloud Inventory

A view of an organization's monitored cloud assets and the logical groupings people build on top of them.

## Language

**Resource**:
A single monitored cloud asset, such as a bucket, database, compute instance, or IAM role.
_Avoid_: Asset, item, node

**Resource Type**:
The kind of cloud service a Resource is, such as "S3 Bucket" or "IAM Role".
_Avoid_: Kind, category, service

**Provider**:
The cloud vendor hosting a Resource: AWS, GCP, or Azure.
_Avoid_: Cloud, vendor, platform

**Environment**:
The deployment stage a Resource serves: production, staging, or development.
_Avoid_: Stage, tier

**Criticality**:
How much harm a Resource's compromise or outage would cause: low, medium, high, or critical.
_Avoid_: Severity, priority, risk

**Owner**:
The team accountable for a Resource.
_Avoid_: Team, maintainer

**Open Issue**:
An unresolved security finding on a Resource.
_Avoid_: Alert, finding, vulnerability

**Application**:
A named, logical group of Resources that together deliver one business function, such as "Payments API". The Resources in an Application are its members. A Resource may belong to any number of Applications.
_Avoid_: Group, collection, project, service
