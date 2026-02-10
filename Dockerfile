FROM harbor-uat.home.arpa/infra/nginx:stable-alpine
WORKDIR /app
COPY /src /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]