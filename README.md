# Hoot Links API
The links management service for [Hoot](https://github.com/chrisashwalker/hoot) - a tiny Human Resources management system built upon microservices. Manages the links/relationships between data objects.  
Developed with NestJS.

## Install dependencies
```
npm install
```

## Run
```
npm run start
```

## Hot reload
```
npm run start:dev
```

## Build Docker image
```
docker build -t hoot-api-links .
```

## Create and run docker container
```
docker run --name hoot-api-links-container -p 8004:8004 hoot-api-links 
```
