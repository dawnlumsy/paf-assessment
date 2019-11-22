drop database if exists music;

create database music;

use music;

create table users (
	user_id varchar(8) not null,
	username varchar(32) not null,
	primary key (user_id)
);

insert into users(user_id, username) values
	('4d0cae84', 'fred'),
	('26a85b1c', 'barney'),
	('675cee52', 'betty'),
	('27b965f6', 'wilma'),
	('820e8a4d', 'bambam'),
	('fc42a34d', 'pebbles');

create table country (
	country_iso  char(2) not null,
	country varchar(128) not null,
	
	primary key (country_iso)
);


-- Change to use mongodb as mongdodb requirement are not met

insert into country (country_iso, country) values 
	('jp','Japan'),
	('my', 'Malaysia'),
	('ru', 'Russia'),
	('sg', 'Singapore'),
	('uk', 'United Kingdom'),
	('us', 'United States');

-- As lyrics can be very long the choice of blob is use
create table songs (
	song_id int auto_increment,
	title varchar(128) not null,
	country_iso  char(2) not null,
	listen_slots int default 3 not null,
	lyrics blob,
    filename varchar(256) not null,
    posted timestamp not null,

	primary key(song_id),
	constraint fk_country_iso
        foreign key(country_iso) references country(country_iso)
);

-- song_slot will be decrement by 1 with each check out
create table song_slot (
	song_slot_id int auto_increment,
	song_id int not null,
	song_slot int default 3 not null,

	primary key(song_slot_id),
	constraint fk_song_id
        foreign key(song_id) references songs(song_id)
);

-- order song table will store the history of songs that were check out by user.
create table song_ord (
	ord_id int auto_increment,
	user_id  varchar(8) not null,
	song_id int not null,
	checkout date,

	primary key(ord_id),
	constraint fk_user_id
        foreign key(user_id) references users(user_id),
	constraint fk_song_id_2
        foreign key(song_id) references songs(song_id)	
);
