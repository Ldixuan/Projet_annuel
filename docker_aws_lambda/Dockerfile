FROM python:alpine3.7

COPY . /worker
WORKDIR /worker
COPY requirements.txt requirements.txt

RUN apk update \
	&& apk add --no-cache lapack libstdc++ \
	&& apk add --no-cache cmake ninja openssl-dev linux-headers \
	make automake gcc g++ subversion gfortran lapack-dev python3-dev \
	&& pip install --no-cache-dir --upgrade pip \
	&& pip install --no-cache-dir cmake==3.20.4 \
	&& ln -sf /usr/local/bin/cmake /usr/bin/cmake \
	&& pip install --no-cache-dir numpy \
	&& pip install --no-cache-dir cython \
	&& pip install --no-cache-dir -r requirements.txt

CMD ["python", "symptomes_checker.py"]
