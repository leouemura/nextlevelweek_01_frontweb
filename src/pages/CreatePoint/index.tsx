import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';  
import { LeafletMouseEvent } from 'leaflet'; 

import axios from 'axios';
import api from '../../services/api';

import './styles.css';
import logo from '../../assets/logo.svg';

interface Item{
    id: number; 
    title: string;
    image_url: string; 
}
interface IBGEUfResponse{
    sigla:string;
}
interface IBGECityResponse{
    nome:string;
}




const CreatePoint: React.FC = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([])

    const [initialPosition, setInitialPosition] = useState<[number,number]>([-23.5029904, -46.6415725,]);
    const [selectedPosition, setSelectedPosition] = useState<[number,number]>([0,0,]);

    const [formData, setFormData] = useState({
        name:'',
        email:'',
        whatsapp:'',
    })

    const history = useHistory();



    //getting items from API
    useEffect(()=>{ 
        api.get('items').then(response =>{
            setItems(response.data)
        })
    },[])

    //getting UF from IBGE API
    useEffect(()=>{
        axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(response =>{
           const ufInitials = response.data.map(uf => uf.sigla); 
           setUfs(ufInitials)
        })
    },[])

    //getting City from IBGE API after user selects UF
    useEffect(()=>{
        if(selectedUf === '0'){
            return;
        }
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(response =>{
           const cityNames = response.data.map(city => city.nome); 
           setCities(cityNames)
        })
    },)

    //getting initial geolocation position
    useEffect(()=>{
        navigator.geolocation.getCurrentPosition((position) => {
            const {latitude, longitude} = position.coords;
            setInitialPosition([latitude,longitude]);
        })
    },[])
    




    //função que obtem a UF
    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectedUf(uf);
    };
    
    //função que obtem a cidade
    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectedCity(city);
    };

    
    //função que obtem a latitude e longitude ao clicar no mapa
    function handleMapClick(event: LeafletMouseEvent): void {
        setSelectedPosition([
            event.latlng.lat, 
            event.latlng.lng,
        ]);
    }

    //função que salva o valor de um determinado input, mantendo os outros inputs salvos
    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name,value} = event.target;
        setFormData({ ...formData, [name]: value })
    }

    //função que seleciona ou deseleciona um determinado item, mantendo os outros items selecionados salvos
    function handleSelectedItem(id: number){
        const alreadySelected = selectedItems.findIndex((item) => item === id);     //retorna -1 quando nao ha um valor correspondente

        if (alreadySelected >= 0) {
          const filteredItems = selectedItems.filter((item) => item !== id);        //deseleciona (ao reselecionar o msm item)
          setSelectedItems(filteredItems);
        } else {
          setSelectedItems([...selectedItems, id]);                                 //seleciona um novo item
        } 
    }

    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name, 
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items,
        };

        await api.post('points', data);
        alert ('Ponto de coleta criado!');

        history.push('/');
    }





    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
            </header>

            <Link to="/">
                <FiArrowLeft/>
                Voltar para home
            </Link>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/>ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input 
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field">
                        <label htmlFor="whatsapp">Whatsapp</label>
                        <input 
                            type="text"
                            name="whatsapp"
                            id="whatsapp"
                            onChange={handleInputChange}
                        />
                    </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    
                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition}/>
                    </Map>


                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf" 
                                id="uf" 
                                value={selectedUf} 
                                onChange={handleSelectedUf}>
                                    <option value="0">Selecione uma UF</option>
                                    {ufs.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city"
                                value={selectedCity}
                                onChange={handleSelectedCity}>
                                    <option value="0">Selecione uma cidade</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item=>(
                            <li 
                                key={item.id} 
                                onClick={()=>handleSelectedItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                            <img src={item.image_url} alt={item.title}/>
                            <span>{item.title}</span>
                        </li>
                        ))}
                        
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    )
}
export default CreatePoint;